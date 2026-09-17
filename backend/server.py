from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import jwt
import bcrypt
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from data import PAYS, PAYS_VERS_DEVISE, TAUX_FALLBACK, SIMULATIONS, FORUM_CATEGORIES, LIENS_INITIAUX

# --- Setup ---
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

app = FastAPI(title="Guide Visa API")
api = APIRouter(prefix="/api")
logger = logging.getLogger("guidevisa")
logging.basicConfig(level=logging.INFO)

# --- Helpers ---
def now() -> datetime:
    return datetime.now(timezone.utc)

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(uid: str, email: str, role: str) -> str:
    payload = {"sub": uid, "email": email, "role": role, "exp": now() + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def create_refresh_token(uid: str) -> str:
    payload = {"sub": uid, "exp": now() + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def clean_user(u: dict) -> dict:
    u.pop('password_hash', None)
    u.pop('_id', None)
    return u

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Non authentifié")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(401, "Token invalide")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(401, "Utilisateur introuvable")
        return clean_user(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token invalide")

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Accès admin requis")
    return user

# --- Models ---
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    nom: str
    prenom: Optional[str] = None
    telephone: Optional[str] = None
    pays_origine: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class SimulationCreate(BaseModel):
    pays_destination: str
    motif: str
    profil: dict = {}

class DocumentCreate(BaseModel):
    nom: str
    categorie: str
    contenu_base64: str
    mime_type: str

class TopicCreate(BaseModel):
    categorie_slug: str
    titre: str
    contenu: str

class ReponseCreate(BaseModel):
    contenu: str

class LienCreate(BaseModel):
    categorie: str
    titre: str
    url: str
    description: str
    pays: str = "INT"
    cout: str = "Gratuit"

# --- Auth ---
def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

@api.post("/auth/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Cet email est déjà utilisé")
    if data.pays_origine not in PAYS_VERS_DEVISE and data.pays_origine != "OTHER":
        raise HTTPException(400, "Pays d'origine invalide")
    devise = PAYS_VERS_DEVISE.get(data.pays_origine, "EUR")
    uid = str(uuid.uuid4())
    user = {
        "id": uid, "email": email, "password_hash": hash_pw(data.password),
        "nom": data.nom, "prenom": data.prenom, "telephone": data.telephone,
        "pays_origine": data.pays_origine, "devise_preferee": devise,
        "role": "user", "statut": "actif",
        "date_inscription": now().isoformat(),
    }
    await db.users.insert_one(user)
    access = create_access_token(uid, email, "user")
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"user": clean_user(user), "access_token": access}

@api.post("/auth/login")
async def login(data: LoginInput, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_pw(data.password, user["password_hash"]):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    if user.get("statut") == "suspendu":
        raise HTTPException(403, "Compte suspendu")
    access = create_access_token(user["id"], email, user.get("role", "user"))
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    await db.users.update_one({"id": user["id"]}, {"$set": {"derniere_connexion": now().isoformat()}})
    return {"user": clean_user(user), "access_token": access}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Déconnecté"}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

# --- Data endpoints ---
@api.get("/pays")
async def list_pays():
    return {"pays": PAYS, "devises": PAYS_VERS_DEVISE}

@api.get("/devises/taux")
async def taux_change(base: str = "EUR"):
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"https://api.frankfurter.app/latest?from={base}")
            if r.status_code == 200:
                data = r.json()
                return {"base": base, "date": data.get("date"), "rates": data.get("rates", {})}
    except Exception as e:
        logger.warning(f"Frankfurter fail: {e}")
    # Fallback
    if base == "EUR":
        return {"base": "EUR", "date": now().date().isoformat(), "rates": {k: v for k, v in TAUX_FALLBACK.items() if k != "EUR"}}
    # Convert via EUR
    base_rate = TAUX_FALLBACK.get(base, 1.0)
    rates = {k: round(v / base_rate, 4) for k, v in TAUX_FALLBACK.items() if k != base}
    return {"base": base, "date": now().date().isoformat(), "rates": rates}

@api.post("/devises/convertir")
async def convertir(payload: dict):
    montant = float(payload.get("montant", 0))
    de = payload.get("de", "EUR")
    vers = payload.get("vers", "XOF")
    if de == vers:
        return {"montant_converti": montant, "taux": 1.0}
    taux_de = TAUX_FALLBACK.get(de, 1.0)
    taux_vers = TAUX_FALLBACK.get(vers, 1.0)
    # base EUR
    en_eur = montant / taux_de
    resultat = en_eur * taux_vers
    return {"montant_converti": round(resultat, 2), "taux": round(taux_vers / taux_de, 6)}

# --- Simulations ---
@api.get("/simulations/pays")
async def list_pays_simulables():
    return [{"code": k, "pays": v["pays"], "drapeau": v["drapeau"], "hero_image": v["hero_image"], "motifs": list(v["motifs"].keys())} for k, v in SIMULATIONS.items()]

@api.get("/simulations/donnees/{pays_code}/{motif}")
async def donnees_simulation(pays_code: str, motif: str):
    p = SIMULATIONS.get(pays_code.upper())
    if not p:
        raise HTTPException(404, "Pays non supporté")
    m = p["motifs"].get(motif)
    if not m:
        raise HTTPException(404, "Motif non disponible pour ce pays")
    return {"pays": p["pays"], "drapeau": p["drapeau"], "devise_officielle": p["devise_officielle"], "motif": motif, **m}

def score_eligibilite(profil: dict, pays: str, motif: str) -> int:
    score = 40
    age = int(profil.get("age", 25))
    if 18 <= age <= 35:
        score += 20
    elif age <= 45:
        score += 10
    diplome = profil.get("diplome", "").lower()
    if "master" in diplome or "doctorat" in diplome:
        score += 20
    elif "licence" in diplome or "bac+3" in diplome:
        score += 15
    elif "bac" in diplome:
        score += 8
    langue = profil.get("niveau_langue", "").upper()
    if langue in ("C1", "C2"):
        score += 15
    elif langue == "B2":
        score += 10
    elif langue == "B1":
        score += 5
    budget = int(profil.get("budget", 0))
    if budget >= 2000000:
        score += 5
    return min(100, score)

@api.post("/simulations")
async def create_simulation(data: SimulationCreate, user: dict = Depends(get_current_user)):
    p = SIMULATIONS.get(data.pays_destination.upper())
    if not p or data.motif not in p["motifs"]:
        raise HTTPException(400, "Pays ou motif non supporté")
    score = score_eligibilite(data.profil, data.pays_destination, data.motif)
    sim = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "pays_destination": data.pays_destination.upper(),
        "motif": data.motif,
        "profil": data.profil,
        "score_eligibilite": score,
        "etape_actuelle": 1,
        "progression_pct": 0,
        "statut": "en_cours",
        "date_debut": now().isoformat(),
        "date_maj": now().isoformat(),
    }
    await db.simulations.insert_one(sim)
    sim.pop("_id", None)
    return sim

@api.get("/simulations/mes")
async def mes_simulations(user: dict = Depends(get_current_user)):
    sims = await db.simulations.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return sims

@api.get("/simulations/{sim_id}")
async def get_simulation(sim_id: str, user: dict = Depends(get_current_user)):
    sim = await db.simulations.find_one({"id": sim_id, "user_id": user["id"]}, {"_id": 0})
    if not sim:
        raise HTTPException(404, "Simulation introuvable")
    p = SIMULATIONS.get(sim["pays_destination"], {})
    m = p.get("motifs", {}).get(sim["motif"], {})
    sim["donnees"] = {"pays": p.get("pays"), "drapeau": p.get("drapeau"), "devise_officielle": p.get("devise_officielle"), **m}
    return sim

@api.patch("/simulations/{sim_id}/progression")
async def update_progression(sim_id: str, payload: dict, user: dict = Depends(get_current_user)):
    etape = int(payload.get("etape_actuelle", 1))
    p = SIMULATIONS.get(payload.get("pays_destination", ""), {})
    m = p.get("motifs", {}).get(payload.get("motif", ""), {})
    total = len(m.get("etapes", [])) or 1
    pct = min(100, int((etape / total) * 100))
    await db.simulations.update_one({"id": sim_id, "user_id": user["id"]},
        {"$set": {"etape_actuelle": etape, "progression_pct": pct, "date_maj": now().isoformat()}})
    return {"ok": True, "progression_pct": pct}

# --- Documents ---
@api.get("/documents")
async def list_documents(user: dict = Depends(get_current_user)):
    docs = await db.documents.find({"user_id": user["id"]}, {"_id": 0, "contenu_base64": 0}).to_list(200)
    return docs

@api.post("/documents")
async def create_document(data: DocumentCreate, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()), "user_id": user["id"],
        "nom": data.nom, "categorie": data.categorie,
        "mime_type": data.mime_type, "contenu_base64": data.contenu_base64,
        "taille": len(data.contenu_base64), "date_upload": now().isoformat(),
    }
    await db.documents.insert_one(doc)
    doc.pop("_id", None); doc.pop("contenu_base64", None)
    return doc

@api.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user: dict = Depends(get_current_user)):
    res = await db.documents.delete_one({"id": doc_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Document introuvable")
    return {"ok": True}

# --- Liens utiles ---
@api.get("/liens")
async def list_liens(categorie: Optional[str] = None, pays: Optional[str] = None):
    q = {"valide": True}
    if categorie:
        q["categorie"] = categorie
    if pays:
        q["pays"] = pays
    liens = await db.liens.find(q, {"_id": 0}).to_list(500)
    return liens

@api.post("/admin/liens")
async def create_lien(data: LienCreate, admin: dict = Depends(require_admin)):
    lien = {"id": str(uuid.uuid4()), **data.model_dump(), "valide": True, "clics": 0,
            "date_ajout": now().isoformat(), "ajoute_par": admin["email"]}
    await db.liens.insert_one(lien)
    lien.pop("_id", None)
    return lien

@api.delete("/admin/liens/{lid}")
async def del_lien(lid: str, admin: dict = Depends(require_admin)):
    await db.liens.delete_one({"id": lid})
    return {"ok": True}

@api.post("/liens/{lid}/clic")
async def clic_lien(lid: str):
    await db.liens.update_one({"id": lid}, {"$inc": {"clics": 1}})
    return {"ok": True}

# --- Forum ---
@api.get("/forum/categories")
async def forum_cats():
    return FORUM_CATEGORIES

@api.get("/forum/topics")
async def list_topics(categorie_slug: Optional[str] = None):
    q = {}
    if categorie_slug:
        q["categorie_slug"] = categorie_slug
    topics = await db.forum_topics.find(q, {"_id": 0}).sort("date_creation", -1).to_list(200)
    return topics

@api.post("/forum/topics")
async def create_topic(data: TopicCreate, user: dict = Depends(get_current_user)):
    if not any(c["slug"] == data.categorie_slug for c in FORUM_CATEGORIES):
        raise HTTPException(400, "Catégorie invalide")
    topic = {
        "id": str(uuid.uuid4()), "categorie_slug": data.categorie_slug,
        "titre": data.titre, "contenu": data.contenu,
        "auteur_id": user["id"], "auteur_nom": user.get("nom", "Utilisateur"),
        "auteur_pays": user.get("pays_origine", ""),
        "nb_reponses": 0, "vues": 0, "epingle": False, "verrouille": False,
        "date_creation": now().isoformat(), "derniere_reponse": now().isoformat(),
    }
    await db.forum_topics.insert_one(topic)
    topic.pop("_id", None)
    return topic

@api.get("/forum/topics/{tid}")
async def get_topic(tid: str):
    topic = await db.forum_topics.find_one({"id": tid}, {"_id": 0})
    if not topic:
        raise HTTPException(404, "Sujet introuvable")
    await db.forum_topics.update_one({"id": tid}, {"$inc": {"vues": 1}})
    reponses = await db.forum_reponses.find({"topic_id": tid}, {"_id": 0}).sort("date_creation", 1).to_list(500)
    return {"topic": topic, "reponses": reponses}

@api.post("/forum/topics/{tid}/reponses")
async def add_reponse(tid: str, data: ReponseCreate, user: dict = Depends(get_current_user)):
    topic = await db.forum_topics.find_one({"id": tid})
    if not topic:
        raise HTTPException(404, "Sujet introuvable")
    rep = {
        "id": str(uuid.uuid4()), "topic_id": tid,
        "contenu": data.contenu, "auteur_id": user["id"],
        "auteur_nom": user.get("nom", "Utilisateur"),
        "likes": 0, "date_creation": now().isoformat(),
    }
    await db.forum_reponses.insert_one(rep)
    await db.forum_topics.update_one({"id": tid},
        {"$inc": {"nb_reponses": 1}, "$set": {"derniere_reponse": now().isoformat()}})
    rep.pop("_id", None)
    return rep

@api.delete("/forum/topics/{tid}")
async def del_topic(tid: str, admin: dict = Depends(require_admin)):
    await db.forum_reponses.delete_many({"topic_id": tid})
    await db.forum_topics.delete_one({"id": tid})
    return {"ok": True}

# --- Admin ---
@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    return {
        "nb_users": await db.users.count_documents({}),
        "nb_simulations": await db.simulations.count_documents({}),
        "nb_documents": await db.documents.count_documents({}),
        "nb_topics": await db.forum_topics.count_documents({}),
        "nb_reponses": await db.forum_reponses.count_documents({}),
        "nb_liens": await db.liens.count_documents({}),
    }

@api.get("/admin/users")
async def admin_list_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api.patch("/admin/users/{uid}")
async def admin_update_user(uid: str, payload: dict, admin: dict = Depends(require_admin)):
    allowed = {k: v for k, v in payload.items() if k in ("statut", "role", "nom", "prenom")}
    await db.users.update_one({"id": uid}, {"$set": allowed})
    return {"ok": True}

@api.delete("/admin/users/{uid}")
async def admin_del_user(uid: str, admin: dict = Depends(require_admin)):
    if admin["id"] == uid:
        raise HTTPException(400, "Impossible de supprimer votre propre compte")
    await db.users.delete_one({"id": uid})
    return {"ok": True}

@api.get("/admin/topics")
async def admin_topics(admin: dict = Depends(require_admin)):
    topics = await db.forum_topics.find({}, {"_id": 0}).sort("date_creation", -1).to_list(500)
    return topics

@api.get("/admin/liens")
async def admin_liens(admin: dict = Depends(require_admin)):
    return await db.liens.find({}, {"_id": 0}).to_list(500)

# --- Startup ---
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.simulations.create_index("user_id")
    await db.documents.create_index("user_id")
    await db.forum_topics.create_index("categorie_slug")
    await db.forum_reponses.create_index("topic_id")
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@digitalkafrique.com")
    admin_pw = os.environ.get("ADMIN_PASSWORD", "Admin@GuideVisa2025")
    existing = await db.users.find_one({"email": admin_email.lower()})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": admin_email.lower(), "password_hash": hash_pw(admin_pw),
            "nom": "Admin", "prenom": "Digitalk", "role": "admin", "statut": "actif",
            "pays_origine": "CI", "devise_preferee": "XOF",
            "date_inscription": now().isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_pw(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email.lower()},
            {"$set": {"password_hash": hash_pw(admin_pw)}})
    # Seed liens
    if await db.liens.count_documents({}) == 0:
        for l in LIENS_INITIAUX:
            await db.liens.insert_one({"id": str(uuid.uuid4()), **l, "valide": True, "clics": 0,
                "date_ajout": now().isoformat(), "ajoute_par": "seed"})
        logger.info(f"Seeded {len(LIENS_INITIAUX)} liens")

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)

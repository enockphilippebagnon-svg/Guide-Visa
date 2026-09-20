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
from data import PAYS, PAYS_VERS_DEVISE, TAUX_FALLBACK, SIMULATIONS, FORUM_CATEGORIES, LIENS_INITIAUX, DOCUMENTS_REQUIS
import base64
import json as jsonlib
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

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
    date_expiration: Optional[str] = None

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
        "taille": len(data.contenu_base64),
        "date_expiration": data.date_expiration,
        "date_upload": now().isoformat(),
    }
    await db.documents.insert_one(doc)
    doc.pop("_id", None); doc.pop("contenu_base64", None)
    return doc

@api.get("/documents/rappels")
async def rappels_expiration(jours: int = 90, user: dict = Depends(get_current_user)):
    """Documents qui expirent dans les X prochains jours (ou deja expires)."""
    docs = await db.documents.find(
        {"user_id": user["id"], "date_expiration": {"$ne": None}},
        {"_id": 0, "contenu_base64": 0}
    ).to_list(500)
    rappels = []
    for d in docs:
        de = d.get("date_expiration")
        if not de:
            continue
        try:
            dt = datetime.fromisoformat(de.replace("Z", "+00:00")) if "T" in de else datetime.fromisoformat(de + "T00:00:00+00:00")
        except Exception:
            continue
        jr = (dt - now()).days
        if jr <= jours:
            d["jours_restants"] = jr
            d["urgence"] = "expire" if jr < 0 else ("critique" if jr <= 30 else "attention")
            rappels.append(d)
    rappels.sort(key=lambda x: x["jours_restants"])
    return rappels

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

@api.get("/admin/stats/detaille")
async def admin_stats_detaille(admin: dict = Depends(require_admin)):
    """Dashboard admin ultra detaille."""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(5000)
    sims = await db.simulations.find({}, {"_id": 0}).to_list(5000)
    docs = await db.documents.find({}, {"_id": 0, "contenu_base64": 0}).to_list(5000)
    topics = await db.forum_topics.find({}, {"_id": 0}).to_list(5000)
    reponses = await db.forum_reponses.find({}, {"_id": 0}).to_list(5000)

    # Users par pays
    users_par_pays = {}
    for u in users:
        p = u.get("pays_origine", "?")
        users_par_pays[p] = users_par_pays.get(p, 0) + 1
    users_par_pays_list = sorted(
        [{"pays": k, "nombre": v} for k, v in users_par_pays.items()],
        key=lambda x: x["nombre"], reverse=True
    )[:15]

    # Users par devise
    devise_par_user = {}
    for u in users:
        d = u.get("devise_preferee", "?")
        devise_par_user[d] = devise_par_user.get(d, 0) + 1

    # Simulations par pays
    sims_par_pays = {}
    for s in sims:
        p = s.get("pays_destination", "?")
        sims_par_pays[p] = sims_par_pays.get(p, 0) + 1
    sims_par_pays_list = [{"pays": k, "nombre": v} for k, v in sims_par_pays.items()]

    # Simulations par motif
    sims_par_motif = {}
    for s in sims:
        m = s.get("motif", "?")
        sims_par_motif[m] = sims_par_motif.get(m, 0) + 1
    sims_par_motif_list = [{"motif": k, "nombre": v} for k, v in sims_par_motif.items()]

    # Score eligibilite moyen
    scores = [s.get("score_eligibilite") for s in sims if s.get("score_eligibilite") is not None]
    score_moyen = int(sum(scores) / len(scores)) if scores else 0

    # Croissance 7 derniers jours
    croissance = []
    today = now().date()
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        d_str = d.isoformat()
        u_ce_jour = sum(1 for u in users if u.get("date_inscription", "").startswith(d_str))
        s_ce_jour = sum(1 for s in sims if s.get("date_debut", "").startswith(d_str))
        croissance.append({
            "date": d.strftime("%d/%m"),
            "utilisateurs": u_ce_jour,
            "simulations": s_ce_jour,
        })

    # Actifs 7j (derniere connexion)
    seuil_7j = (now() - timedelta(days=7)).isoformat()
    actifs_7j = sum(1 for u in users if u.get("derniere_connexion", "") >= seuil_7j)

    # Top users (par nombre de reponses forum + topics)
    activity_par_user = {}
    for t in topics:
        uid = t.get("auteur_id")
        if uid:
            activity_par_user[uid] = activity_par_user.get(uid, 0) + 2
    for r in reponses:
        uid = r.get("auteur_id")
        if uid:
            activity_par_user[uid] = activity_par_user.get(uid, 0) + 1
    top_ids = sorted(activity_par_user.items(), key=lambda x: -x[1])[:5]
    top_users = []
    for uid, pts in top_ids:
        u = next((x for x in users if x.get("id") == uid), None)
        if u:
            top_users.append({
                "id": uid, "nom": u.get("nom", ""), "email": u.get("email", ""),
                "pays_origine": u.get("pays_origine", ""), "points": pts,
            })

    # Activite recente : 20 derniers events (inscriptions, sims, topics)
    events = []
    for u in users:
        if u.get("date_inscription"):
            events.append({
                "type": "inscription", "date": u["date_inscription"],
                "libelle": f"{u.get('nom','?')} s'est inscrit",
                "pays": u.get("pays_origine"),
            })
    for s in sims:
        events.append({
            "type": "simulation", "date": s.get("date_debut", ""),
            "libelle": f"Simulation {s.get('pays_destination')}/{s.get('motif')} lancee (score {s.get('score_eligibilite', 0)})",
            "pays": s.get("pays_destination"),
        })
    for t in topics:
        events.append({
            "type": "topic", "date": t.get("date_creation", ""),
            "libelle": f"Sujet forum : {t.get('titre', '')[:60]}",
            "pays": t.get("auteur_pays"),
        })
    events.sort(key=lambda x: x["date"], reverse=True)
    activite_recente = events[:20]

    # Docs par categorie
    docs_par_cat = {}
    for d in docs:
        c = d.get("categorie", "?")
        docs_par_cat[c] = docs_par_cat.get(c, 0) + 1

    # Nombre de suspendus
    nb_suspendus = sum(1 for u in users if u.get("statut") == "suspendu")

    return {
        "totaux": {
            "utilisateurs": len(users), "actifs_7j": actifs_7j, "suspendus": nb_suspendus,
            "simulations": len(sims), "score_moyen": score_moyen,
            "documents": len(docs), "topics": len(topics), "reponses": len(reponses),
            "liens": await db.liens.count_documents({}),
        },
        "users_par_pays": users_par_pays_list,
        "devises": [{"devise": k, "nombre": v} for k, v in devise_par_user.items()],
        "sims_par_pays": sims_par_pays_list,
        "sims_par_motif": sims_par_motif_list,
        "docs_par_categorie": [{"categorie": k, "nombre": v} for k, v in docs_par_cat.items()],
        "croissance_7j": croissance,
        "top_users": top_users,
        "activite_recente": activite_recente,
    }

@api.get("/admin/users")
async def admin_list_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api.get("/admin/users/{uid}/detail")
async def admin_user_detail(uid: str, admin: dict = Depends(require_admin)):
    u = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not u:
        raise HTTPException(404, "Utilisateur introuvable")
    sims = await db.simulations.find({"user_id": uid}, {"_id": 0}).to_list(200)
    docs_cnt = await db.documents.count_documents({"user_id": uid})
    topics = await db.forum_topics.find({"auteur_id": uid}, {"_id": 0}).to_list(200)
    reponses_cnt = await db.forum_reponses.count_documents({"auteur_id": uid})
    return {
        "user": u,
        "simulations": sims,
        "nb_documents": docs_cnt,
        "topics": topics,
        "nb_reponses": reponses_cnt,
    }

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

# --- AI Document Analyzer ---
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

async def _analyser_document_ia(doc: dict, contexte: dict) -> dict:
    """Analyse une image de document via Gemini vision. Retourne un verdict JSON."""
    if not EMERGENT_LLM_KEY:
        return {"status": "erreur", "message": "IA non configurée"}
    mime = doc.get("mime_type", "")
    if not mime.startswith("image/"):
        return {"status": "non_supporte",
                "message": "L'analyse IA fonctionne pour l'instant sur les images (JPG, PNG). Pour un PDF, convertis-le en image."}
    system = (
        "Tu es un assistant expert en immigration africaine, spécialisé dans la vérification de documents pour Guide Visa "
        "(édité par Digitalk Afrique). Tu analyses une image de document et vérifies sa conformité pour une procédure d'immigration. "
        "Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans markdown, avec ces clés exactement : "
        '{"type_detecte": string, "est_conforme": true|false, "score_qualite": 0-100, '
        '"probleme": [string], "manque": [string], "recommandations": [string], "verdict_court": string}. '
        "Sois bienveillant et pédagogue en français simple."
    )
    prompt = (
        f"Document uploadé par l'utilisateur dans la catégorie **{doc.get('categorie')}** "
        f"pour une procédure **{contexte.get('procedure', 'immigration générale')}**. "
        f"Nom du fichier : `{doc.get('nom')}`.\n\n"
        "Analyse cette image et dis :\n"
        "1. Quel type de document est-ce ? (passeport, diplôme, relevé bancaire, photo d'identité, test de langue, contrat, autre)\n"
        "2. Est-il conforme et lisible ? (qualité, netteté, signature, date, cachet)\n"
        "3. Quels problèmes vois-tu ? (flou, coupé, expiré, photocopie de mauvaise qualité, informations manquantes)\n"
        "4. Que manque-t-il pour la procédure sélectionnée ?\n"
        "5. Recommandations concrètes pour améliorer.\n\n"
        "Réponds STRICTEMENT en JSON."
    )
    try:
        chat = (LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"doc-{doc.get('id')}", system_message=system)
                .with_model("gemini", "gemini-2.5-flash"))
        img = ImageContent(image_base64=doc["contenu_base64"])
        response = await chat.send_message(UserMessage(text=prompt, file_contents=[img]))
        txt = response.strip() if isinstance(response, str) else str(response)
        # Extract JSON if wrapped in code fences
        if "```" in txt:
            txt = txt.split("```")[1].replace("json", "", 1).strip()
        result = jsonlib.loads(txt)
        result["status"] = "ok"
        return result
    except jsonlib.JSONDecodeError:
        return {"status": "ok", "type_detecte": "Document", "est_conforme": None,
                "score_qualite": 50, "probleme": [], "manque": [],
                "recommandations": ["Analyse IA partielle, réessaye avec une image plus nette."],
                "verdict_court": txt[:300] if 'txt' in dir() else "Réponse IA non structurée"}
    except Exception as e:
        logger.error(f"IA doc analyse: {e}")
        return {"status": "erreur", "message": f"L'IA n'a pas pu analyser ce document ({str(e)[:100]})"}

@api.post("/documents/{doc_id}/analyser")
async def analyser_document(doc_id: str, payload: dict = None, user: dict = Depends(get_current_user)):
    doc = await db.documents.find_one({"id": doc_id, "user_id": user["id"]})
    if not doc:
        raise HTTPException(404, "Document introuvable")
    contexte = payload or {}
    if contexte.get("simulation_id"):
        sim = await db.simulations.find_one({"id": contexte["simulation_id"], "user_id": user["id"]})
        if sim:
            p = SIMULATIONS.get(sim["pays_destination"], {})
            m = p.get("motifs", {}).get(sim["motif"], {})
            contexte["procedure"] = f"{m.get('titre', 'immigration')} ({p.get('pays', '')})"
    result = await _analyser_document_ia(doc, contexte)
    await db.documents.update_one({"id": doc_id},
        {"$set": {"analyse_ia": result, "date_analyse": now().isoformat()}})
    return result

@api.get("/simulations/{sim_id}/verifier-dossier")
async def verifier_dossier(sim_id: str, user: dict = Depends(get_current_user)):
    sim = await db.simulations.find_one({"id": sim_id, "user_id": user["id"]})
    if not sim:
        raise HTTPException(404, "Simulation introuvable")
    requis = DOCUMENTS_REQUIS.get(sim["pays_destination"], {}).get(sim["motif"], [])
    docs = await db.documents.find({"user_id": user["id"]}, {"_id": 0, "contenu_base64": 0}).to_list(500)
    checklist = []
    for r in requis:
        match = None
        for d in docs:
            nom_l = d.get("nom", "").lower()
            if d.get("categorie") == r["categorie"] and any(mc in nom_l for mc in r["mots_cles"]):
                match = d
                break
        checklist.append({
            "requis": r["nom"],
            "categorie": r["categorie"],
            "present": bool(match),
            "document": match,
        })
    total = len(checklist)
    presents = sum(1 for c in checklist if c["present"])
    return {
        "sim_id": sim_id,
        "procedure": SIMULATIONS.get(sim["pays_destination"], {}).get("motifs", {}).get(sim["motif"], {}).get("titre"),
        "total": total,
        "presents": presents,
        "manquants": total - presents,
        "progression_pct": int((presents / total) * 100) if total else 0,
        "checklist": checklist,
    }

# --- Anti-arnaque comparator ---
@api.post("/simulations/{sim_id}/auditer-tout")
async def auditer_dossier_complet(sim_id: str, user: dict = Depends(get_current_user)):
    """Audite tous les documents image d'un dossier via IA et produit un rapport agrege."""
    sim = await db.simulations.find_one({"id": sim_id, "user_id": user["id"]})
    if not sim:
        raise HTTPException(404, "Simulation introuvable")
    requis = DOCUMENTS_REQUIS.get(sim["pays_destination"], {}).get(sim["motif"], [])
    procedure_titre = SIMULATIONS.get(sim["pays_destination"], {}).get("motifs", {}).get(sim["motif"], {}).get("titre", "Immigration")
    all_docs = await db.documents.find({"user_id": user["id"]}).to_list(500)
    rapport = {
        "sim_id": sim_id, "procedure": procedure_titre,
        "pays": sim["pays_destination"], "motif": sim["motif"],
        "date_audit": now().isoformat(),
        "utilisateur": (user.get("nom", "") + " " + (user.get("prenom") or "")).strip(),
        "total_requis": len(requis), "docs_uploaded": len(all_docs),
        "docs_analyses": [], "score_global": 0,
        "points_forts": [], "points_faibles": [], "docs_manquants": [],
    }
    scores = []
    for r in requis:
        match = None
        for d in all_docs:
            nom_l = d.get("nom", "").lower()
            if d.get("categorie") == r["categorie"] and any(mc in nom_l for mc in r["mots_cles"]):
                match = d
                break
        if not match:
            rapport["docs_manquants"].append(r["nom"])
            continue
        if not match.get("mime_type", "").startswith("image/"):
            rapport["docs_analyses"].append({
                "requis": r["nom"], "nom_fichier": match["nom"],
                "categorie": r["categorie"], "status": "non_analysable",
                "message": "Format non image (PDF). Verifie manuellement.",
            })
            scores.append(65)
            continue
        analyse = await _analyser_document_ia(match, {"procedure": procedure_titre})
        entry = {
            "requis": r["nom"], "nom_fichier": match["nom"],
            "categorie": r["categorie"], "status": analyse.get("status"),
            "type_detecte": analyse.get("type_detecte"),
            "est_conforme": analyse.get("est_conforme"),
            "score_qualite": analyse.get("score_qualite"),
            "verdict": analyse.get("verdict_court"),
            "probleme": analyse.get("probleme", []),
            "recommandations": analyse.get("recommandations", []),
        }
        rapport["docs_analyses"].append(entry)
        if isinstance(analyse.get("score_qualite"), (int, float)):
            scores.append(analyse["score_qualite"])
            if analyse.get("est_conforme") is True and analyse["score_qualite"] >= 70:
                rapport["points_forts"].append(f"{r['nom']} : conforme ({analyse['score_qualite']}/100)")
            elif analyse.get("est_conforme") is False:
                rapport["points_faibles"].append(f"{r['nom']} : a corriger")
    if scores and requis:
        rapport["score_global"] = int((sum(scores) / len(scores)) * (len(scores) / len(requis)))
    if rapport["score_global"] >= 75:
        rapport["verdict_global"] = "Dossier solide, pret a etre depose."
        rapport["couleur"] = "#2ECC71"
    elif rapport["score_global"] >= 50:
        rapport["verdict_global"] = "Dossier correct, des corrections sont necessaires."
        rapport["couleur"] = "#F9CA24"
    else:
        rapport["verdict_global"] = "Dossier incomplet. Priorise les documents manquants."
        rapport["couleur"] = "#E74C3C"
    await db.audits.insert_one({**rapport, "id": str(uuid.uuid4())})
    return rapport

@api.post("/anti-arnaque/comparer")
async def comparer_arnaque(payload: dict):
    pays = payload.get("pays", "").upper()
    motif = payload.get("motif", "")
    montant_demande = float(payload.get("montant_demande", 0))
    devise_demandee = payload.get("devise_demandee", "EUR")
    p = SIMULATIONS.get(pays)
    if not p or motif not in p.get("motifs", {}):
        raise HTTPException(400, "Combinaison pays/motif inconnue")
    m = p["motifs"][motif]
    cout_officiel_devise = m["cout_total"]
    devise_officielle = p["devise_officielle"]
    # Convert both to EUR for comparison
    taux_off = TAUX_FALLBACK.get(devise_officielle, 1.0)
    taux_dem = TAUX_FALLBACK.get(devise_demandee, 1.0)
    officiel_eur = cout_officiel_devise / taux_off
    demande_eur = montant_demande / taux_dem
    ratio = demande_eur / officiel_eur if officiel_eur > 0 else 0
    ecart_eur = demande_eur - officiel_eur
    # Verdict
    if ratio <= 1.5:
        verdict = "SAFE"
        label = "Prix raisonnable "
        message = "Le montant demandé est proche des frais officiels. Vérifie tout de même la source."
        couleur = "#2ECC71"
    elif ratio <= 3:
        verdict = "SUSPECT"
        label = "Attention, prix suspect "
        message = "Le montant est plus élevé que les frais officiels. Demande le détail exact des frais."
        couleur = "#F9CA24"
    else:
        verdict = "ARNAQUE"
        label = "Arnaque probable "
        message = f"Le montant est {ratio:.1f}× plus élevé que les frais officiels. Ne paye pas, vérifie sur les sites officiels."
        couleur = "#E74C3C"
    # Convert to user's local currency
    devise_user = payload.get("devise_utilisateur", devise_demandee)
    taux_user = TAUX_FALLBACK.get(devise_user, 1.0)
    return {
        "verdict": verdict, "label": label, "message": message, "couleur": couleur,
        "ratio": round(ratio, 2),
        "cout_officiel": {"montant": cout_officiel_devise, "devise": devise_officielle,
                         "en_devise_utilisateur": round(officiel_eur * taux_user, 2),
                         "devise_utilisateur": devise_user},
        "montant_demande": {"montant": montant_demande, "devise": devise_demandee,
                            "en_devise_utilisateur": round(demande_eur * taux_user, 2)},
        "ecart_eur": round(ecart_eur, 2),
        "procedure": m.get("titre"),
        "conseil_final": "Utilise uniquement les liens officiels de ta simulation. Aucun agent ne peut 'accélérer' officiellement.",
    }

# --- Startup ---
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.simulations.create_index("user_id")
    await db.documents.create_index("user_id")
    await db.forum_topics.create_index("categorie_slug")
    await db.forum_reponses.create_index("topic_id")
    # Seed admin (Digitalk Afrique)
    admin_email = os.environ.get("ADMIN_EMAIL", "digitalkafrique@gmail.com").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "Digitalk2026!")
    # Nettoyer les anciens admins (ex : admin@digitalkafrique.com) pour ne garder que celui de la config
    await db.users.delete_many({"role": "admin", "email": {"$ne": admin_email}})
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": admin_email, "password_hash": hash_pw(admin_pw),
            "nom": "Digitalk", "prenom": "Afrique", "role": "admin", "statut": "actif",
            "pays_origine": "CI", "devise_preferee": "XOF",
            "date_inscription": now().isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    else:
        # Force role admin + mot de passe a jour + identite Digitalk
        updates = {"role": "admin", "statut": "actif", "nom": "Digitalk", "prenom": "Afrique"}
        if not verify_pw(admin_pw, existing["password_hash"]):
            updates["password_hash"] = hash_pw(admin_pw)
        await db.users.update_one({"email": admin_email}, {"$set": updates})
        logger.info(f"Admin refreshed: {admin_email}")
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

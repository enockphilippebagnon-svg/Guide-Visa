"""Backend tests for iteration 3: audit-tout, document expiration rappels, data cleanup."""
import os
import io
import base64
import re
from datetime import datetime, timedelta, timezone
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://immi-simulator.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = "admin@digitalkafrique.com"
ADMIN_PW = "Admin@GuideVisa2025"

# Regex for typical emojis and em-dash
EMOJI_RE = re.compile(
    "["
    "\U0001F1E0-\U0001F1FF"  # flags
    "\U0001F300-\U0001F5FF"
    "\U0001F600-\U0001F64F"
    "\U0001F680-\U0001F6FF"
    "\U0001F700-\U0001F77F"
    "\U0001F780-\U0001F7FF"
    "\U0001F800-\U0001F8FF"
    "\U0001F900-\U0001F9FF"
    "\U0001FA00-\U0001FA6F"
    "\U0001FA70-\U0001FAFF"
    "\U00002600-\U000026FF"
    "\U00002700-\U000027BF"
    "]", flags=re.UNICODE
)


@pytest.fixture(scope="session")
def auth():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}, timeout=10)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _jpeg_b64():
    from PIL import Image, ImageDraw
    img = Image.new("RGB", (400, 400), color=(240, 240, 240))
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, 380, 380], outline=(0, 0, 0), width=3)
    d.text((60, 180), "PASSEPORT SPECIMEN", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()


# --- Data cleanup ---
class TestDataCleanup:
    def test_pays_drapeaux_empty(self):
        r = requests.get(f"{BASE_URL}/api/pays", timeout=10)
        assert r.status_code == 200
        data = r.json()
        pays = data["pays"] if isinstance(data, dict) else data
        assert len(pays) > 0
        for p in pays:
            assert p.get("drapeau", "") == "", f"Pays {p['code']} has drapeau={p.get('drapeau')!r}"
            assert not EMOJI_RE.search(p.get("nom", "")), f"Emoji in pays nom: {p['nom']}"

    def test_forum_categories_no_emoji(self):
        r = requests.get(f"{BASE_URL}/api/forum/categories", timeout=10)
        assert r.status_code == 200
        cats = r.json()
        assert len(cats) > 0
        for c in cats:
            assert not EMOJI_RE.search(c.get("nom", "")), f"Emoji in cat: {c['nom']!r}"

    def test_simulations_pays_drapeaux_empty(self):
        r = requests.get(f"{BASE_URL}/api/simulations/pays", timeout=10)
        assert r.status_code == 200
        for p in r.json():
            assert p.get("drapeau", "") == "", f"Sim pays {p.get('code')} drapeau={p.get('drapeau')!r}"


# --- Document expiration ---
class TestDocumentExpiration:
    def test_upload_with_date_expiration(self, auth):
        exp = (datetime.now(timezone.utc) + timedelta(days=45)).date().isoformat()
        r = requests.post(f"{BASE_URL}/api/documents", json={
            "nom": "TEST_exp_45j.jpg", "categorie": "identite",
            "contenu_base64": _jpeg_b64(), "mime_type": "image/jpeg",
            "date_expiration": exp,
        }, headers=auth, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["date_expiration"] == exp, d
        return d["id"]

    def test_rappels_endpoint(self, auth):
        # Create a doc expiring in 20 days (critique) and one in 100 days (should not appear at jours=90)
        exp20 = (datetime.now(timezone.utc) + timedelta(days=20)).date().isoformat()
        exp100 = (datetime.now(timezone.utc) + timedelta(days=100)).date().isoformat()
        exp_past = (datetime.now(timezone.utc) - timedelta(days=5)).date().isoformat()

        r1 = requests.post(f"{BASE_URL}/api/documents", json={
            "nom": "TEST_rappel_20j.jpg", "categorie": "identite",
            "contenu_base64": _jpeg_b64(), "mime_type": "image/jpeg",
            "date_expiration": exp20,
        }, headers=auth, timeout=15)
        assert r1.status_code == 200
        r2 = requests.post(f"{BASE_URL}/api/documents", json={
            "nom": "TEST_rappel_expired.jpg", "categorie": "identite",
            "contenu_base64": _jpeg_b64(), "mime_type": "image/jpeg",
            "date_expiration": exp_past,
        }, headers=auth, timeout=15)
        assert r2.status_code == 200
        r3 = requests.post(f"{BASE_URL}/api/documents", json={
            "nom": "TEST_rappel_100j.jpg", "categorie": "identite",
            "contenu_base64": _jpeg_b64(), "mime_type": "image/jpeg",
            "date_expiration": exp100,
        }, headers=auth, timeout=15)
        assert r3.status_code == 200

        r = requests.get(f"{BASE_URL}/api/documents/rappels?jours=90", headers=auth, timeout=10)
        assert r.status_code == 200, r.text
        rappels = r.json()
        assert isinstance(rappels, list)
        noms = [x["nom"] for x in rappels]
        assert "TEST_rappel_20j.jpg" in noms
        assert "TEST_rappel_expired.jpg" in noms
        assert "TEST_rappel_100j.jpg" not in noms

        for rp in rappels:
            for k in ("id", "nom", "date_expiration", "jours_restants", "urgence"):
                assert k in rp, f"missing {k}: {rp}"
            assert rp["urgence"] in ("expire", "critique", "attention")
            if rp["jours_restants"] < 0:
                assert rp["urgence"] == "expire"
            elif rp["jours_restants"] <= 30:
                assert rp["urgence"] == "critique"
            else:
                assert rp["urgence"] == "attention"


# --- Audit tout ---
class TestAuditTout:
    def test_auditer_tout_returns_full_report(self, auth):
        # Create a simulation
        r = requests.post(f"{BASE_URL}/api/simulations",
                          json={"pays_destination": "CA", "motif": "etudes",
                                "profil": {"age": 25, "diplome": "Licence", "niveau_langue": "B2", "budget": 2000000}},
                          headers=auth, timeout=10)
        assert r.status_code == 200
        sim_id = r.json()["id"]

        # Upload one image doc (passeport)
        r2 = requests.post(f"{BASE_URL}/api/documents", json={
            "nom": "passeport_audit.jpg", "categorie": "identite",
            "contenu_base64": _jpeg_b64(), "mime_type": "image/jpeg",
        }, headers=auth, timeout=15)
        assert r2.status_code == 200

        # Audit
        r3 = requests.post(f"{BASE_URL}/api/simulations/{sim_id}/auditer-tout",
                           headers=auth, timeout=90)
        assert r3.status_code == 200, r3.text
        rap = r3.json()
        for k in ("score_global", "verdict_global", "couleur", "docs_analyses",
                  "docs_manquants", "points_forts", "points_faibles",
                  "total_requis", "docs_uploaded", "procedure", "date_audit", "utilisateur"):
            assert k in rap, f"missing {k}: {list(rap.keys())}"
        assert isinstance(rap["docs_analyses"], list)
        assert isinstance(rap["docs_manquants"], list)
        assert isinstance(rap["score_global"], int)
        assert rap["total_requis"] >= 1

    def test_auditer_tout_unknown_sim(self, auth):
        r = requests.post(f"{BASE_URL}/api/simulations/does-not-exist/auditer-tout",
                          headers=auth, timeout=10)
        assert r.status_code == 404

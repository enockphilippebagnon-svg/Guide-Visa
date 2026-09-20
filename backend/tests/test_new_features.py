"""Backend tests for new Guide Visa features: anti-arnaque, dossier checklist, AI doc analyzer."""
import os
import io
import base64
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://immi-simulator.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = "admin@digitalkafrique.com"
ADMIN_PW = "Admin@GuideVisa2025"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}, timeout=10)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# --- Anti-arnaque ---
class TestAntiArnaque:
    def test_arnaque_high_amount(self):
        r = requests.post(f"{BASE_URL}/api/anti-arnaque/comparer",
                          json={"pays": "CA", "motif": "etudes", "montant_demande": 3000000,
                                "devise_demandee": "XOF", "devise_utilisateur": "XOF"}, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["verdict"] == "ARNAQUE", d
        assert d["ratio"] > 3

    def test_safe_or_suspect_realistic(self):
        r = requests.post(f"{BASE_URL}/api/anti-arnaque/comparer",
                          json={"pays": "CA", "motif": "etudes", "montant_demande": 200000,
                                "devise_demandee": "XOF", "devise_utilisateur": "XOF"}, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["verdict"] in ("SAFE", "SUSPECT"), d

    def test_invalid_pays_motif(self):
        r = requests.post(f"{BASE_URL}/api/anti-arnaque/comparer",
                          json={"pays": "ZZ", "motif": "xxx", "montant_demande": 1000,
                                "devise_demandee": "EUR"}, timeout=10)
        assert r.status_code == 400


# --- Dossier checklist ---
class TestDossierChecklist:
    def test_checklist_7_items(self, auth):
        # Create a simulation CA/etudes
        r = requests.post(f"{BASE_URL}/api/simulations",
                          json={"pays_destination": "CA", "motif": "etudes",
                                "profil": {"age": 25, "diplome": "Licence", "niveau_langue": "B2", "budget": 2000000}},
                          headers=auth, timeout=10)
        assert r.status_code == 200, r.text
        sim_id = r.json()["id"]

        r2 = requests.get(f"{BASE_URL}/api/simulations/{sim_id}/verifier-dossier", headers=auth, timeout=10)
        assert r2.status_code == 200, r2.text
        d = r2.json()
        assert d["total"] == 7, d
        assert "progression_pct" in d
        assert isinstance(d["checklist"], list) and len(d["checklist"]) == 7
        for item in d["checklist"]:
            assert "requis" in item and "present" in item
            assert isinstance(item["present"], bool)


# --- AI document analyzer ---
def _make_jpeg_base64():
    """Return base64 of a real ~300x300 JPEG image."""
    try:
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (400, 400), color=(240, 240, 240))
        d = ImageDraw.Draw(img)
        d.rectangle([20, 20, 380, 380], outline=(0, 0, 0), width=3)
        d.text((60, 180), "PASSEPORT SPECIMEN", fill=(0, 0, 0))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return base64.b64encode(buf.getvalue()).decode()
    except Exception:
        # Fetch a real image as fallback
        r = requests.get("https://picsum.photos/400", timeout=10)
        return base64.b64encode(r.content).decode()


class TestAIAnalyzer:
    def test_analyse_image(self, auth):
        b64 = _make_jpeg_base64()
        # Upload doc
        r = requests.post(f"{BASE_URL}/api/documents",
                          json={"nom": "passeport_test.jpg", "categorie": "identite",
                                "contenu_base64": b64, "mime_type": "image/jpeg"},
                          headers=auth, timeout=15)
        assert r.status_code == 200, r.text
        doc_id = r.json()["id"]

        r2 = requests.post(f"{BASE_URL}/api/documents/{doc_id}/analyser",
                           json={}, headers=auth, timeout=45)
        assert r2.status_code == 200, r2.text
        d = r2.json()
        assert d.get("status") == "ok", f"AI response: {d}"
        for k in ("type_detecte", "est_conforme", "score_qualite", "probleme", "manque", "recommandations", "verdict_court"):
            assert k in d, f"missing {k}: {d}"

    def test_analyse_pdf_non_supporte(self, auth):
        b64 = base64.b64encode(b"%PDF-1.4 fake pdf content").decode()
        r = requests.post(f"{BASE_URL}/api/documents",
                          json={"nom": "test.pdf", "categorie": "divers",
                                "contenu_base64": b64, "mime_type": "application/pdf"},
                          headers=auth, timeout=10)
        assert r.status_code == 200, r.text
        doc_id = r.json()["id"]
        r2 = requests.post(f"{BASE_URL}/api/documents/{doc_id}/analyser",
                           json={}, headers=auth, timeout=15)
        assert r2.status_code == 200, r2.text
        assert r2.json().get("status") == "non_supporte", r2.json()

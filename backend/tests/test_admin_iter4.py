"""Iteration 4 - New admin endpoints and updated credentials."""
import os, uuid, requests, pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://immi-simulator.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

NEW_ADMIN = {"email": "digitalkafrique@gmail.com", "password": "Digitalk2026!"}
OLD_ADMIN = {"email": "admin@digitalkafrique.com", "password": "Admin@GuideVisa2025"}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json=NEW_ADMIN, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    assert data["user"]["email"] == NEW_ADMIN["email"]
    assert "access_token" in data and len(data["access_token"]) > 20
    return data["access_token"]


@pytest.fixture(scope="module")
def user_token():
    email = f"TEST_iter4_{uuid.uuid4().hex[:8]}@test.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Test@1234", "nom": "Test", "prenom": "User",
        "pays_origine": "SN", "devise_preferee": "XOF"
    }, timeout=15)
    assert r.status_code in (200, 201), r.text
    return r.json()["access_token"], r.json()["user"]["id"]


def test_new_admin_login_ok(admin_token):
    assert admin_token


def test_old_admin_login_denied():
    r = requests.post(f"{API}/auth/login", json=OLD_ADMIN, timeout=15)
    assert r.status_code in (401, 403, 400, 404), f"Old admin still can login! {r.status_code} {r.text}"


def test_stats_detaille_shape(admin_token):
    r = requests.get(f"{API}/admin/stats/detaille",
                     headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ["totaux", "users_par_pays", "devises", "sims_par_pays", "sims_par_motif",
              "docs_par_categorie", "croissance_7j", "top_users", "activite_recente"]:
        assert k in d, f"missing key {k}"
    for k in ["utilisateurs", "actifs_7j", "suspendus", "simulations", "score_moyen",
              "documents", "topics", "reponses", "liens"]:
        assert k in d["totaux"], f"totaux missing {k}"
    assert isinstance(d["croissance_7j"], list) and len(d["croissance_7j"]) == 7
    for pt in d["croissance_7j"]:
        assert "date" in pt and "utilisateurs" in pt and "simulations" in pt


def test_stats_detaille_requires_admin(user_token):
    tok, _ = user_token
    r = requests.get(f"{API}/admin/stats/detaille",
                     headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 403


def test_stats_detaille_requires_auth():
    r = requests.get(f"{API}/admin/stats/detaille", timeout=15)
    assert r.status_code in (401, 403)


def test_user_detail_shape(admin_token, user_token):
    _, uid = user_token
    r = requests.get(f"{API}/admin/users/{uid}/detail",
                     headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ["user", "simulations", "nb_documents", "topics", "nb_reponses"]:
        assert k in d, f"missing {k}"
    assert d["user"]["id"] == uid
    assert isinstance(d["simulations"], list)
    assert isinstance(d["topics"], list)
    assert isinstance(d["nb_documents"], int)
    assert isinstance(d["nb_reponses"], int)


def test_user_detail_requires_admin(user_token):
    tok, uid = user_token
    r = requests.get(f"{API}/admin/users/{uid}/detail",
                     headers={"Authorization": f"Bearer {tok}"}, timeout=15)
    assert r.status_code == 403


def test_user_detail_anon():
    r = requests.get(f"{API}/admin/users/anything/detail", timeout=15)
    assert r.status_code in (401, 403)


def test_admin_nom_updated(admin_token):
    r = requests.get(f"{API}/auth/me",
                     headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
    assert r.status_code == 200
    u = r.json()
    assert u.get("nom") == "Digitalk"
    assert u.get("prenom") == "Afrique"

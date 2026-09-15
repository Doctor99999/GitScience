"""
test_editorial.py — Editorial workflow: happy-path полного цикла + RBAC negatives.

Используем изолированный FinalEditorialEngine на tmp_path через monkeypatch,
чтобы тесты не засоряли реальное gitscience_data/editorial.
"""
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import routes.deps as deps_mod
import routes.editorial as editorial_mod
from gitscience_editorial import EditorialUser, FinalEditorialEngine
from main import app

# ── Fixtures ────────────────────────────────────────────────────────────

EDITOR_EIC = EditorialUser(
    user_id="u_eic", orcid="0000-0002-1111-2222", name="Chief Editor",
    email="eic@test.org", roles=["editor_in_chief"],
    expertise_areas=["cardiology"], h_index=30, institution="Test Institute",
)
EDITOR_ADMIN = EditorialUser(
    user_id="u_admin", orcid="0000-0002-1111-2223", name="Platform Admin",
    email="admin@test.org", roles=["platform_admin"],
)


def _login(client: TestClient, orcid: str, name: str = "Scholar") -> dict:
    res = client.post("/api/v1/auth/login", json={"orcid": orcid, "name": name})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture()
def ed_engine(monkeypatch, tmp_path):
    """Fresh EditorialEngine на tmp_path + патчинг модулей."""
    eng = FinalEditorialEngine(storage_dir=str(tmp_path))
    eng.register_user(EDITOR_EIC)
    eng.register_user(EDITOR_ADMIN)
    monkeypatch.setattr(deps_mod, "editorial_engine", eng)
    monkeypatch.setattr(editorial_mod, "editorial_engine", eng)
    return eng


@pytest.fixture()
def client(ed_engine):
    return TestClient(app)


# ── Happy-path: полный цикл ────────────────────────────────────────────

class TestEditorialHappyPath:
    def test_full_cycle(self, client, ed_engine):
        AUTHOR_ORCID = "0000-0003-5555-1111"
        REVIEWER_ORCID = "0000-0003-5555-2222"
        title = "Cardiac Stem Cells in Adult Myocardium"

        # 1. Register author
        hdr_author = _login(client, AUTHOR_ORCID, "Author A")
        reg = client.post("/api/v1/editorial/register-user", headers=hdr_author, json={
            "user_id": "au1", "orcid": AUTHOR_ORCID, "name": "Author A",
            "email": "a@test.org", "roles": ["author"],
            "expertise_areas": ["cardiology"],
        })
        assert reg.status_code == 200, reg.text

        # 2. Submit manuscript
        sub = client.post("/api/v1/editorial/submit", headers=hdr_author, json={
            "title": title, "abstract": "We demonstrate...",
            "authors": [{"name": "Author A", "orcid": AUTHOR_ORCID}],
            "corresponding_author_orcid": AUTHOR_ORCID,
            "category": "cardiology",
            "keywords": ["cardiology", "stem cells"],
        })
        assert sub.status_code == 200, sub.text
        sub_id = sub.json()["submission_id"]

        # 3. Assign editor (editor_in_chief)
        hdr_eic = _login(client, EDITOR_EIC.orcid, EDITOR_EIC.name)
        ae = client.post(f"/api/v1/editorial/assign-editor/{sub_id}/u_eic", headers=hdr_eic)
        assert ae.status_code == 200, ae.text
        assert ae.json()["status"] == "ok"

        # 4. Register reviewer
        hdr_rev = _login(client, REVIEWER_ORCID, "Reviewer R")
        reg_rev = client.post("/api/v1/editorial/register-user", headers=hdr_rev, json={
            "user_id": "rev1", "orcid": REVIEWER_ORCID, "name": "Reviewer R",
            "email": "r@test.org", "roles": ["reviewer"],
            "expertise_areas": ["cardiology"], "h_index": 15,
        })
        assert reg_rev.status_code == 200, reg_rev.text

        # 5. Find reviewers
        fr = client.get(f"/api/v1/editorial/find-reviewers/{sub_id}", headers=hdr_eic)
        assert fr.status_code == 200, fr.text

        # 6. Assign reviewers
        ar = client.post(f"/api/v1/editorial/assign-reviewers/{sub_id}", headers=hdr_eic, json={
            "reviewer_orcids": [REVIEWER_ORCID],
        })
        assert ar.status_code == 200, ar.text
        review_ids = ar.json()["review_ids"]
        assert len(review_ids) == 1
        review_id = review_ids[0]

        # 7. Submit review
        sr = client.post(f"/api/v1/editorial/submit-review/{review_id}", headers=hdr_rev, json={
            "reviewer_orcid": REVIEWER_ORCID,
            "recommendation": "accept",
            "confidence_level": 4,
            "summary": "Excellent work.",
            "strengths": ["novel approach"],
            "weaknesses": [],
        })
        assert sr.status_code == 200, sr.text

        # 8. Decision accepted
        dec = client.post(f"/api/v1/editorial/decision/{sub_id}", headers=hdr_eic, json={
            "editor_orcid": EDITOR_EIC.orcid,
            "decision": "accepted",
            "rationale": "Sound methodology.",
        })
        assert dec.status_code == 200, dec.text
        assert dec.json()["decision"] == "accepted"
        assert dec.json()["doi"] is not None

        # 9. Mint DOI
        md = client.post(f"/api/v1/editorial/doi/mint/{sub_id}", headers=hdr_eic)
        assert md.status_code == 200, md.text

        # 10. JATS export
        je = client.get(f"/api/v1/editorial/export/jats/{sub_id}", headers=hdr_eic)
        assert je.status_code == 200, je.text
        assert je.headers["content-type"].startswith("application/xml")
        assert title.encode() in je.content

        # 11. Analytics dashboard
        dash = client.get("/api/v1/editorial/analytics/dashboard", headers=hdr_eic)
        assert dash.status_code == 200, dash.text


# ── RBAC negatives ──────────────────────────────────────────────────────

class TestEditorialRBAC:
    def test_anon_register_user(self, client):
        """Без JWT → 401"""
        res = client.post("/api/v1/editorial/register-user", json={
            "user_id": "x", "orcid": "0000-0000-0000-0001", "name": "X",
            "email": "x@x.x", "roles": ["author"],
        })
        assert res.status_code == 401

    def test_register_editor_role_without_privilege(self, client):
        """Автор не может назначить editor_in_chief себе → 403"""
        hdr = _login(client, "0000-0003-9999-9999", "Hacker")
        res = client.post("/api/v1/editorial/register-user", headers=hdr, json={
            "user_id": "hacker", "orcid": "0000-0003-9999-9999",
            "name": "Hacker", "email": "h@x.x", "roles": ["editor_in_chief"],
        })
        assert res.status_code == 403

    def test_register_user_orcid_mismatch_sybil(self, client):
        """Регистрация с чужим ORCID в теле (токен другой) → 403"""
        hdr = _login(client, "0000-0003-9999-1111")
        res = client.post("/api/v1/editorial/register-user", headers=hdr, json={
            "user_id": "fake", "orcid": "0000-0003-9999-2222",
            "name": "Fake", "email": "f@x.x", "roles": ["author"],
        })
        assert res.status_code == 403
        assert "Sybil" in res.json()["detail"]

    def test_register_invalid_role(self, client):
        """Недопустимая роль → 422"""
        hdr = _login(client, "0000-0003-9999-3333")
        res = client.post("/api/v1/editorial/register-user", headers=hdr, json={
            "user_id": "bad", "orcid": "0000-0003-9999-3333",
            "name": "Bad", "email": "b@x.x", "roles": ["superadmin"],
        })
        assert res.status_code == 422

    def test_submit_manuscript_requires_auth(self, client):
        res = client.post("/api/v1/editorial/submit", json={
            "title": "X", "abstract": "X",
            "authors": [{"name": "X", "orcid": "0000-0000-0000-0000"}],
            "corresponding_author_orcid": "0000-0000-0000-0000",
            "category": "general",
        })
        assert res.status_code == 401

    def test_assign_editor_requires_editor_role(self, client):
        """Автор (не editor) не может назначить редактора → 403"""
        hdr = _login(client, "0000-0003-9999-4444")
        client.post("/api/v1/editorial/register-user", headers=hdr, json={
            "user_id": "u_normal", "orcid": "0000-0003-9999-4444",
            "name": "Normal", "email": "n@x.x", "roles": ["author"],
        })
        res = client.post("/api/v1/editorial/assign-editor/fake_id/u_eic", headers=hdr)
        assert res.status_code == 403

    def test_find_reviewers_requires_editor_role(self, client):
        hdr = _login(client, "0000-0003-9999-5555")
        client.post("/api/v1/editorial/register-user", headers=hdr, json={
            "user_id": "u_norm2", "orcid": "0000-0003-9999-5555",
            "name": "Normal2", "email": "n2@x.x", "roles": ["author"],
        })
        res = client.get("/api/v1/editorial/find-reviewers/fake_id", headers=hdr)
        assert res.status_code == 403

    def test_decision_requires_editor_role(self, client):
        hdr = _login(client, "0000-0003-9999-6666")
        client.post("/api/v1/editorial/register-user", headers=hdr, json={
            "user_id": "u_norm3", "orcid": "0000-0003-9999-6666",
            "name": "Normal3", "email": "n3@x.x", "roles": ["author"],
        })
        res = client.post("/api/v1/editorial/decision/fake_id", headers=hdr, json={
            "editor_orcid": "0000-0003-9999-6666", "decision": "accepted",
        })
        assert res.status_code == 403

    def test_mint_doi_requires_editor_role(self, client):
        hdr = _login(client, "0000-0003-9999-7777")
        client.post("/api/v1/editorial/register-user", headers=hdr, json={
            "user_id": "u_norm4", "orcid": "0000-0003-9999-7777",
            "name": "Normal4", "email": "n4@x.x", "roles": ["author"],
        })
        res = client.post("/api/v1/editorial/doi/mint/fake_id", headers=hdr)
        assert res.status_code == 403

    def test_submit_review_orcid_mismatch_sybil(self, client):
        """Рецензент подаёт отзыв с чужим ORCID → 403"""
        REV_ORCID = "0000-0003-5555-2222"
        FAKE_ORCID = "0000-0003-9999-8888"
        hdr = _login(client, REV_ORCID)
        client.post("/api/v1/editorial/register-user", headers=hdr, json={
            "user_id": "rev_sybil", "orcid": REV_ORCID, "name": "Rev",
            "email": "rs@x.x", "roles": ["reviewer"],
        })
        hdr_fake = _login(client, FAKE_ORCID)
        client.post("/api/v1/editorial/register-user", headers=hdr_fake, json={
            "user_id": "fake_user", "orcid": FAKE_ORCID, "name": "Fake",
            "email": "fu@x.x", "roles": ["author"],
        })
        # Сначала подать manuscript + assign reviewers, чтобы review_id существовал
        hdr_author = _login(client, "0000-0003-5555-0001", "Author")
        sub = client.post("/api/v1/editorial/submit", headers=hdr_author, json={
            "title": "Test", "abstract": "A", "authors": [{"name": "A", "orcid": "0000-0003-5555-0001"}],
            "corresponding_author_orcid": "0000-0003-5555-0001",
            "category": "general", "keywords": [],
        })
        sub_id = sub.json()["submission_id"]
        hdr_eic = _login(client, EDITOR_EIC.orcid)
        client.post(f"/api/v1/editorial/assign-editor/{sub_id}/u_eic", headers=hdr_eic)
        ar = client.post(f"/api/v1/editorial/assign-reviewers/{sub_id}", headers=hdr_eic, json={
            "reviewer_orcids": [REV_ORCID],
        })
        review_id = ar.json()["review_ids"][0]

        # Sybil: JWT для FAKE_ORCID, но reviewer_orcid в теле = REV_ORCID → 403
        res2 = client.post(f"/api/v1/editorial/submit-review/{review_id}", headers=hdr_fake, json={
            "reviewer_orcid": REV_ORCID, "recommendation": "reject",
            "confidence_level": 2, "summary": "Bad",
        })
        assert res2.status_code == 403
        assert "Sybil" in res2.json()["detail"]

    def test_anon_submit_review(self, client):
        """Без JWT → 401"""
        res = client.post("/api/v1/editorial/submit-review/fake_review", json={
            "reviewer_orcid": "0000-0000-0000-0000",
            "recommendation": "accept", "summary": "Good",
        })
        assert res.status_code == 401

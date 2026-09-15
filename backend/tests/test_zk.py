"""
test_zk.py — Zero-Knowledge Discovery: happy-path + RBAC negatives + engine edge cases.

test_api.py покрывает commit+reveal flow. Здесь добавляем:
- reveal с неверным salt/payload → verified=False
- reveal от другого автора → 403
- commit anonymously → 401
- list commitments
- unit-тесты ZKDiscoveryEngine на tmp_path (deteterminism hash, wrong salt, etc.)
"""
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import routes.deps as deps_mod
import routes.research as research_mod
from gitscience_zk import ZKDiscoveryEngine

# ── Helpers ─────────────────────────────────────────────────────────────

def _login(cl: TestClient, orcid: str, name: str = "Scholar"):
    r = cl.post("/api/v1/auth/login", json={"orcid": orcid, "name": name})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def zk_engine(tmp_path):
    """Изолированный ZKEngine на tmp_path."""
    return ZKDiscoveryEngine(storage_dir=tmp_path)


@pytest.fixture()
def client(zk_engine, monkeypatch):
    """TestClient с патчем zk_engine в routes."""
    monkeypatch.setattr(deps_mod, "zk_engine", zk_engine)
    monkeypatch.setattr(research_mod, "zk_engine", zk_engine)
    from main import app as _app
    return TestClient(_app)


# ── Route-level RBAC + edge cases ───────────────────────────────────────

class TestZKRouteRBAC:
    def test_commit_requires_jwt(self, client):
        res = client.post("/api/v1/zk/commit", json={
            "author_orcid": "0000-0000-0000-0000", "author_name": "Anon",
            "hypothesis_title": "T", "secret_salt": "123456",
            "hidden_payload_text": "secret",
        })
        assert res.status_code == 401

    def test_reveal_requires_jwt(self, client):
        res = client.post("/api/v1/zk/reveal", json={
            "commitment_id": "ZK-FAKE", "secret_salt": "123456",
            "revealed_payload_text": "payload",
        })
        assert res.status_code == 401

    def test_commit_binds_orcid_from_token(self, client):
        """author_orcid в теле игнорируется; привязка идёт из JWT."""
        hdr = _login(client, "0000-0005-1111-2222")
        payload = {
            "author_orcid": "ATTACKER-ORCID",
            "author_name": "Real Author",
            "hypothesis_title": "Hydrogen Bond Anomaly",
            "secret_salt": "salt123456",
            "hidden_payload_text": "Hidden H2O model",
            "hidden_formula": "(H + O) / Bond",
        }
        r = client.post("/api/v1/zk/commit", json=payload, headers=hdr)
        assert r.status_code == 200, r.text
        assert r.json()["author_orcid"] == "0000-0005-1111-2222"

    def test_reveal_by_different_author_forbidden(self, client):
        """Reveal commitment чужим JWT → 403"""
        hdr_a = _login(client, "0000-0005-3333-4444", "Author A")
        r = client.post("/api/v1/zk/commit", json={
            "author_orcid": "0000-0005-3333-4444", "author_name": "Author A",
            "hypothesis_title": "Graphene Test",
            "secret_salt": "gph-salt-001",
            "hidden_payload_text": "Graphene yields anomaly at 300K",
            "hidden_formula": "(C * lattice) / temp",
        }, headers=hdr_a)
        assert r.status_code == 200
        cid = r.json()["commitment_id"]

        hdr_b = _login(client, "0000-0005-5555-6666", "Attacker B")
        r2 = client.post("/api/v1/zk/reveal", json={
            "commitment_id": cid, "secret_salt": "gph-salt-001",
            "revealed_payload_text": "Graphene yields anomaly at 300K",
            "revealed_formula": "(C * lattice) / temp",
        }, headers=hdr_b)
        assert r2.status_code == 403
        assert "Only the commitment author can reveal" in r2.json()["detail"]

    def test_reveal_wrong_salt_returns_verified_false(self, client):
        """Неверный secret_salt → verified=False (математическое доказательство отвергнуто)."""
        hdr = _login(client, "0000-0005-7777-8888")
        r = client.post("/api/v1/zk/commit", json={
            "author_orcid": "0000-0005-7777-8888", "author_name": "Author C",
            "hypothesis_title": "Protein Folding",
            "secret_salt": "correct-salt-aaa",
            "hidden_payload_text": "Alpha helix dominant",
            "hidden_formula": "(aa * helix) / temp",
        }, headers=hdr)
        cid = r.json()["commitment_id"]

        r2 = client.post("/api/v1/zk/reveal", json={
            "commitment_id": cid, "secret_salt": "WRONG-SALT-BBB",
            "revealed_payload_text": "Alpha helix dominant",
            "revealed_formula": "(aa * helix) / temp",
        }, headers=hdr)
        assert r2.status_code == 200
        data = r2.json()
        assert data["verified"] is False
        assert "отвергнуто" in data["error"]

    def test_reveal_wrong_payload_returns_verified_false(self, client):
        """Неверный payload_text → verified=False."""
        hdr = _login(client, "0000-0005-9999-1111")
        r = client.post("/api/v1/zk/commit", json={
            "author_orcid": "0000-0005-9999-1111", "author_name": "Author D",
            "hypothesis_title": "RNA Folding",
            "secret_salt": "rna-salt-001",
            "hidden_payload_text": "True RNA structure is X",
            "hidden_formula": "RNA * structure",
        }, headers=hdr)
        cid = r.json()["commitment_id"]

        r2 = client.post("/api/v1/zk/reveal", json={
            "commitment_id": cid, "secret_salt": "rna-salt-001",
            "revealed_payload_text": "Tampered payload text here!!!",
            "revealed_formula": "RNA * structure",
        }, headers=hdr)
        assert r2.status_code == 200
        assert r2.json()["verified"] is False

    def test_list_commitments(self, client):
        """GET /api/v1/zk/list — возвращает список."""
        r = client.get("/api/v1/zk/list")
        assert r.status_code == 200
        assert "commitments" in r.json()

    def test_commit_and_full_reveal_happy_path(self, client):
        """Полный happy-path: commit → reveal → verified=True."""
        hdr = _login(client, "0000-0005-1212-3434")
        r = client.post("/api/v1/zk/commit", json={
            "author_orcid": "0000-0005-1212-3434", "author_name": "Happy Scholar",
            "hypothesis_title": "Superconductor at 290K",
            "secret_salt": "sc-salt-ok-001",
            "hidden_payload_text": "LK-99 analog via coprecipitation",
            "hidden_formula": "(Pb * Cu) / (P * O * apatite)",
        }, headers=hdr)
        assert r.status_code == 200
        cid = r.json()["commitment_id"]

        r2 = client.post("/api/v1/zk/reveal", json={
            "commitment_id": cid, "secret_salt": "sc-salt-ok-001",
            "revealed_payload_text": "LK-99 analog via coprecipitation",
            "revealed_formula": "(Pb * Cu) / (P * O * apatite)",
        }, headers=hdr)
        assert r2.status_code == 200
        data = r2.json()
        assert data["verified"] is True
        assert data["status"] == "MATHEMATICALLY_PROVEN_PRIOR_ART"
        assert "legal_effect" in data


# ── Unit-тесты Engine на tmp_path ───────────────────────────────────────

class TestZKEngineUnit:
    def test_commitment_hash_deterministic(self, zk_engine):
        """Одинаковые параметры → одинаковый commitment hash."""
        r1 = zk_engine.create_blind_commitment(
            author_orcid="0000-0000-1111-2222", author_name="Test",
            hypothesis_title="Hypothesis", secret_salt="salt-aaa",
            hidden_payload_text="payload-123", hidden_formula="A + B",
        )
        r2 = zk_engine.create_blind_commitment(
            author_orcid="0000-0000-1111-2222", author_name="Test",
            hypothesis_title="Hypothesis", secret_salt="salt-aaa",
            hidden_payload_text="payload-123", hidden_formula="A + B",
        )
        assert r1["zk_commitment_hash"] == r2["zk_commitment_hash"]
        assert r1["commitment_id"] == r2["commitment_id"]

    def test_different_salt_different_hash(self, zk_engine):
        """Разный salt → разный commitment hash."""
        r1 = zk_engine.create_blind_commitment(
            author_orcid="0000-0000-1111-3333", author_name="Test",
            hypothesis_title="H", secret_salt="aaa",
            hidden_payload_text="p", hidden_formula="f",
        )
        r2 = zk_engine.create_blind_commitment(
            author_orcid="0000-0000-1111-3333", author_name="Test",
            hypothesis_title="H", secret_salt="bbb",
            hidden_payload_text="p", hidden_formula="f",
        )
        assert r1["zk_commitment_hash"] != r2["zk_commitment_hash"]
        assert r1["commitment_id"] != r2["commitment_id"]

    def test_reveal_correct_salt_verified_true(self, zk_engine):
        r = zk_engine.create_blind_commitment(
            author_orcid="0000-0000-1111-4444", author_name="Test",
            hypothesis_title="H", secret_salt="correct-salt",
            hidden_payload_text="payload-ok", hidden_formula="formula-ok",
        )
        res = zk_engine.reveal_and_verify(
            commitment_id=r["commitment_id"],
            secret_salt="correct-salt",
            revealed_payload_text="payload-ok",
            revealed_formula="formula-ok",
            author_orcid="0000-0000-1111-4444",
        )
        assert res["verified"] is True
        assert res["status"] == "MATHEMATICALLY_PROVEN_PRIOR_ART"

    def test_reveal_wrong_salt_verified_false(self, zk_engine):
        r = zk_engine.create_blind_commitment(
            author_orcid="0000-0000-1111-5555", author_name="Test",
            hypothesis_title="H", secret_salt="real-salt",
            hidden_payload_text="payload", hidden_formula="formula",
        )
        res = zk_engine.reveal_and_verify(
            commitment_id=r["commitment_id"],
            secret_salt="wrong-salt",
            revealed_payload_text="payload",
            revealed_formula="formula",
            author_orcid="0000-0000-1111-5555",
        )
        assert res["verified"] is False
        assert "отвергнуто" in res["error"]

    def test_reveal_nonexistent_commitment(self, zk_engine):
        res = zk_engine.reveal_and_verify(
            commitment_id="ZK-NONEXISTENT",
            secret_salt="x", revealed_payload_text="x",
        )
        assert res["verified"] is False
        assert "не найден" in res["error"]

    def test_commitments_persist_and_list(self, zk_engine):
        zk_engine.create_blind_commitment(
            author_orcid="0000-0000-1111-6666", author_name="A",
            hypothesis_title="H1", secret_salt="s1",
            hidden_payload_text="p1",
        )
        zk_engine.create_blind_commitment(
            author_orcid="0000-0000-1111-7777", author_name="B",
            hypothesis_title="H2", secret_salt="s2",
            hidden_payload_text="p2",
        )
        all_c = zk_engine.get_all_commitments()
        assert len(all_c) >= 2
        ids = {c["commitment_id"] for c in all_c}
        assert len(ids) >= 2

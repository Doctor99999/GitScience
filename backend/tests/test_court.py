"""
test_court.py — Science Court: RBAC negatives + edge cases.

Покрытие в test_api.py: vote requires JWT, Sybil mismatch, full flow + quorum.
Здесь добавляем: abstain votes, invalid majority verdict, invalid vote type,
unknown case, disputes JWT/sybil checks, duplicate vote, moratorium edge.
"""
import hashlib as _hashlib
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app

# ── Helpers ─────────────────────────────────────────────────────────────

def _login(cl: TestClient, orcid: str, name: str = "Scholar"):
    r = cl.post("/api/v1/auth/login", json={"orcid": orcid, "name": name})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def client():
    return TestClient(app)


def _file_dispute(cl, hdr, claimant_orcid, target_code="GS-2026-TEST", reason="Plagiarism"):
    r = cl.post("/api/v1/court/dispute", headers=hdr, json={
        "claimant_name": "Claimant", "claimant_orcid": claimant_orcid,
        "target_code": target_code, "reason": reason,
        "evidence_hash": "0x" + _hashlib.sha256(b"ev").hexdigest(),
    })
    assert r.status_code == 200, r.text
    return r.json()["case"]


# ── RBAC negatives ──────────────────────────────────────────────────────

class TestCourtRBAC:
    def test_vote_requires_jwt(self, client):
        res = client.post("/api/v1/court/vote", json={
            "case_id": "FAKE", "juror_orcid": "0000-0000-0000-0001", "vote": "valid",
        })
        assert res.status_code == 401

    def test_dispute_requires_jwt(self, client):
        res = client.post("/api/v1/court/dispute", json={
            "claimant_name": "X", "claimant_orcid": "0000-0000-0000-0001",
            "target_code": "FAKE", "reason": "Plagiarism and misconduct claim here",
            "evidence_hash": "0xdeadbeef",
        })
        assert res.status_code == 401

    def test_vote_orcid_mismatch_sybil(self, client):
        """JWT orcid ≠ juror_orcid в теле → 403 Sybil"""
        hdr = _login(client, "0009-0003-3929-3605")
        res = client.post("/api/v1/court/vote", headers=hdr, json={
            "case_id": "FAKE", "juror_orcid": "0009-0002-1111-2222", "vote": "valid",
        })
        assert res.status_code == 403
        assert "Sybil" in res.json()["detail"]

    def test_dispute_orcid_mismatch_sybil(self, client):
        """JWT orcid ≠ claimant_orcid в теле → 403 Sybil"""
        hdr = _login(client, "0009-0003-3929-3605")
        res = client.post("/api/v1/court/dispute", headers=hdr, json={
            "claimant_name": "X", "claimant_orcid": "0009-0002-9999-0000",
            "target_code": "FAKE", "reason": "Plagiarism",
            "evidence_hash": "0xdeadbeef",
        })
        assert res.status_code == 403
        assert "Sybil" in res.json()["detail"]


# ── Edge cases ──────────────────────────────────────────────────────────

class TestCourtEdgeCases:
    def test_vote_unknown_case(self, client):
        """Голос по несуществующему делу → error status"""
        hdr = _login(client, "0009-0003-3929-3605")
        r = client.post("/api/v1/court/vote", headers=hdr, json={
            "case_id": "NO-SUCH-CASE", "juror_orcid": "0009-0003-3929-3605",
            "vote": "valid",
        })
        assert r.status_code == 200
        assert r.json()["status"] == "ERROR"

    def test_vote_invalid_value_rejected(self, client):
        """Невалидное значение голоса → 422 (pydantic pattern)"""
        hdr = _login(client, "0009-0003-3929-3605")
        r = client.post("/api/v1/court/vote", headers=hdr, json={
            "case_id": "X", "juror_orcid": "0009-0003-3929-3605",
            "vote": "spoofed",
        })
        assert r.status_code == 422

    def test_duplicate_vote_returns_error(self, client):
        """Дубль голоса одного присяжного → ERROR"""
        hdr_c = _login(client, "0009-0003-3929-3605")
        case = _file_dispute(client, hdr_c, "0009-0003-3929-3605", "GS-2026-DUP")
        case_id = case["case_id"]

        hdr_j = _login(client, "0009-0001-1111-1111")
        r1 = client.post("/api/v1/court/vote", headers=hdr_j, json={
            "case_id": case_id, "juror_orcid": "0009-0001-1111-1111", "vote": "valid",
        })
        assert r1.status_code == 200 and r1.json()["status"] == "VOTE_RECORDED"

        r2 = client.post("/api/v1/court/vote", headers=hdr_j, json={
            "case_id": case_id, "juror_orcid": "0009-0001-1111-1111", "vote": "valid",
        })
        assert r2.status_code == 200
        assert r2.json()["status"] == "ERROR"

    def test_abstain_votes_count_toward_quorum(self, client):
        """Abstain голоса входят в total ≥ 5, valid > invalid → CHALLENGED"""
        hdr_c = _login(client, "0009-0003-3929-3605")
        case = _file_dispute(client, hdr_c, "0009-0003-3929-3605", "GS-2026-ABSTAIN")
        case_id = case["case_id"]

        jurors = [
            ("0009-0001-1111-1111", "valid"),
            ("0009-0001-2222-2222", "valid"),
            ("0009-0001-3333-3333", "valid"),
            ("0009-0001-4444-4444", "abstain"),
            ("0009-0001-5555-5555", "abstain"),
        ]
        for jorcid, vote in jurors:
            r = client.post("/api/v1/court/vote", headers=_login(client, jorcid), json={
                "case_id": case_id, "juror_orcid": jorcid, "vote": vote,
            })
            assert r.status_code == 200, r.text

        cases = client.get("/api/v1/court/cases").json()["cases"]
        c = next(x for x in cases if x["case_id"] == case_id)
        assert c["votes"]["valid"] == 3
        assert c["votes"]["abstain"] == 2
        assert c["status"] == "VERDICT_PRIOR_ART_CHALLENGED"

    def test_verdict_confirmed_invalid_majority(self, client):
        """invalid > valid при 6 голосах → CONFIRMED"""
        hdr_c = _login(client, "0009-0003-3929-3605")
        case = _file_dispute(client, hdr_c, "0009-0003-3929-3605", "GS-2026-CONFIRM")
        case_id = case["case_id"]

        jurors = [
            ("0009-0001-1111-1111", "invalid"),
            ("0009-0001-2222-2222", "invalid"),
            ("0009-0001-3333-3333", "invalid"),
            ("0009-0001-4444-4444", "invalid"),
            ("0009-0001-5555-5555", "valid"),
            ("0009-0001-6666-6666", "valid"),
        ]
        for jorcid, vote in jurors:
            r = client.post("/api/v1/court/vote", headers=_login(client, jorcid), json={
                "case_id": case_id, "juror_orcid": jorcid, "vote": vote,
            })
            assert r.status_code == 200, r.text

        cases = client.get("/api/v1/court/cases").json()["cases"]
        c = next(x for x in cases if x["case_id"] == case_id)
        assert c["votes"]["invalid"] == 4
        assert c["votes"]["valid"] == 2
        assert c["status"] == "VERDICT_PRIOR_ART_CONFIRMED"

    def test_anon_vote_on_valid_case(self, client):
        """Анонимный голос на существующем деле → 401"""
        hdr_c = _login(client, "0009-0003-3929-3605")
        case = _file_dispute(client, hdr_c, "0009-0003-3929-3605", "GS-2026-ANONVOTE")
        r = client.post("/api/v1/court/vote", json={
            "case_id": case["case_id"],
            "juror_orcid": "0009-0001-1111-1111", "vote": "valid",
        })
        assert r.status_code == 401

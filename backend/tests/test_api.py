# -*- coding: utf-8 -*-
"""
test_api.py — Integration and Route Tests for FastAPI Application
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_healthcheck_root(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ONLINE_SOVEREIGN"

def test_api_v1_health(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "database" in data
    assert "vault_storage" in data

def test_stats_summary(client):
    res = client.get("/api/v1/stats/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_notarized_manuscripts" in data
    assert "blockchain_attestation_status" in data

def test_compiler_endpoint(client):
    res = client.post("/api/v1/compiler/verify-formula", json={"formula": "(Artery + Vein) / (Lymph + 1.0)"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert "ast_merkle_digest" in data

def test_library_catalog_and_search(client):
    res = client.get("/library")
    assert res.status_code == 200
    data = res.json()
    assert "articles" in data

    res_search = client.get("/api/v1/library/search?q=homeostasis")
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["status"] == "SEARCH_SUCCESS"

def test_certificate_pdf_generation(client):
    res = client.get("/certificate/pdf/GS-2026-00001")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000

def test_zk_commit_and_reveal_flow(client):
    commit_payload = {
        "author_orcid": "0009-0003-3929-3605",
        "author_name": "Salauat Yeshimov",
        "hypothesis_title": "Unit Test Discovery",
        "secret_salt": "pytest-secret-123",
        "hidden_payload_text": "Secret formula text for testing",
        "hidden_formula": "(Artery * 2.0) / Lymph"
    }
    commit_res = client.post("/api/v1/zk/commit", json=commit_payload)
    assert commit_res.status_code == 200
    commit_data = commit_res.json()
    cid = commit_data["commitment_id"]

    reveal_payload = {
        "commitment_id": cid,
        "secret_salt": "pytest-secret-123",
        "revealed_payload_text": "Secret formula text for testing",
        "revealed_formula": "(Artery * 2.0) / Lymph"
    }
    reveal_res = client.post("/api/v1/zk/reveal", json=reveal_payload)
    assert reveal_res.status_code == 200
    assert reveal_res.json()["verified"] is True

def test_datacite_xml_export(client):
    res = client.get("/api/v1/notary/datacite/GS-2026-00001/xml")
    assert res.status_code == 200
    assert "application/xml" in res.headers["content-type"]
    assert b"10.5281/gitscience" in res.content
    assert b"datacite.org/schema/kernel-4" in res.content

def test_institutional_invoice_pdf_download(client):
    res = client.get("/api/v1/billing/fiat/invoice/INV-2026-TEST/pdf?base_license_fee=5000")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000

def test_web3_live_wallet_balance(client):
    res = client.get("/api/v1/wallet/balance/0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37")
    assert res.status_code == 200
    data = res.json()
    assert data["is_connected"] is True
    assert data["is_founder"] is True
    assert data["simulated"] is False
    assert data["offchain_usdt_balance"] is None
    assert "native_balance_matic" in data

def test_orcid_auth_and_jwt_flow(client):
    lookup_res = client.get("/api/v1/auth/orcid/0009-0003-3929-3605")
    assert lookup_res.status_code == 200
    assert lookup_res.json()["orcid"] == "0009-0003-3929-3605"

    login_res = client.post("/api/v1/auth/login", json={
        "orcid": "0009-0003-3929-3605",
        "name": "Salauat Yeshimov"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    token = login_data["access_token"]

    verify_res = client.post("/api/v1/auth/verify", json={"token": token})
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "TOKEN_VALID"
    assert verify_res.json()["payload"]["orcid"] == "0009-0003-3929-3605"

def test_jwt_logout_revocation_and_refresh_rotation(client):
    login_res = client.post("/api/v1/auth/login", json={"orcid": "0009-0001-2234-5678"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Refresh: новый токен выпускается, старый ротируется (отзывается)
    refresh_res = client.post("/api/v1/auth/refresh", json={"token": token})
    assert refresh_res.status_code == 200
    refreshed = refresh_res.json()
    assert refreshed["status"] == "REFRESHED"
    new_token = refreshed["access_token"]
    assert new_token != token

    # Старый токен отозван — verify должен отклонить с "Token revoked"
    old_verify = client.post("/api/v1/auth/verify", json={"token": token})
    assert old_verify.status_code == 401
    assert "revoked" in old_verify.json()["detail"].lower()

    # Новый токен валиден
    new_verify = client.post("/api/v1/auth/verify", json={"token": new_token})
    assert new_verify.status_code == 200

    # Явный logout отзывает и новый токен
    logout_res = client.post("/api/v1/auth/logout", json={"token": new_token})
    assert logout_res.status_code == 200
    final_verify = client.post("/api/v1/auth/verify", json={"token": new_token})
    assert final_verify.status_code == 401

# =====================================================================
# SECURITY REGRESSION (Production Hardening Round)
# =====================================================================

import hashlib as _hashlib
import hmac as _hmac
import time as _time

def _auth_header_for(cl, orcid: str, name: str = "Test Scholar"):
    login = cl.post("/api/v1/auth/login", json={"orcid": orcid, "name": name})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}

def test_court_vote_requires_jwt(client):
    res = client.post("/api/v1/court/vote", json={
        "case_id": "CASE-2026-001", "juror_orcid": "0009-0002-1111-2222", "vote": "valid"
    })
    assert res.status_code == 401

def test_court_vote_rejects_orcid_mismatch_sybil(client):
    attacker_headers = _auth_header_for(client, "0009-0003-3929-3605")
    res = client.post("/api/v1/court/vote", headers=attacker_headers, json={
        "case_id": "CASE-2026-001",
        "juror_orcid": "0009-0002-1111-2222",  # подмена личности в теле
        "vote": "valid"
    })
    assert res.status_code == 403
    assert "Sybil" in res.json()["detail"]

def test_peer_review_requires_jwt_and_binds_identity(client):
    res_anon = client.post("/api/v1/review/submit", json={
        "target_code": "GS-2026-00001",
        "reviewer_orcid": "0009-0001-2234-5678",
        "math_rigor_score": 9, "methodology_score": 9,
        "ethics_score": 9, "novelty_score": 9,
        "review_comments": "Solid reproducibility."
    })
    assert res_anon.status_code == 401
    reviewer = "0009-0001-2234-5678"
    ok_res = client.post("/api/v1/review/submit", headers=_auth_header_for(client, reviewer), json={
        "target_code": "GS-2026-00001",
        "reviewer_orcid": reviewer,
        "math_rigor_score": 9, "methodology_score": 9,
        "ethics_score": 9, "novelty_score": 9,
        "review_comments": "Solid reproducibility via Safe AST."
    })
    assert ok_res.status_code == 200

def test_fiat_webhook_signature_enforced(client):
    body = {"invoice_number": "INV-GS-2026-SECTEST", "paid_amount": 12000.0}

    # Без секрета сервис заблокирован
    os.environ.pop("FIAT_WEBHOOK_SECRET", None)
    res_no_secret = client.post("/api/v1/billing/fiat/webhook", json=body)
    assert res_no_secret.status_code == 503

    # С секретом: unsigned / replayed / valid
    os.environ["FIAT_WEBHOOK_SECRET"] = "unittest-webhook-secret"
    try:
        res_unsigned = client.post(
            "/api/v1/billing/fiat/webhook", json=body,
            headers={"X-GS-Timestamp": str(int(_time.time()))}
        )
        assert res_unsigned.status_code == 401

        stale_ts = str(int(_time.time()) - 4000)
        sig_stale = _hmac.new(b"unittest-webhook-secret", f"{stale_ts}.".encode() + b"{}", _hashlib.sha256).hexdigest()
        res_stale = client.post(
            "/api/v1/billing/fiat/webhook", json=body,
            headers={"X-GS-Timestamp": stale_ts, "X-GS-Signature": sig_stale}
        )
        assert res_stale.status_code == 401

        import json as _json
        raw = _json.dumps(body).encode()
        ts_now = str(int(_time.time()))
        sig_ok = _hmac.new(b"unittest-webhook-secret", f"{ts_now}.".encode() + raw, _hashlib.sha256).hexdigest()
        res_ok = client.post(
            "/api/v1/billing/fiat/webhook", content=raw,
            headers={"Content-Type": "application/json", "X-GS-Timestamp": ts_now, "X-GS-Signature": sig_ok}
        )
        assert res_ok.status_code == 200
        assert res_ok.json()["status"] == "SETTLED_ON_CHAIN"
    finally:
        os.environ.pop("FIAT_WEBHOOK_SECRET", None)

def test_upload_pdf_magic_bytes_enforced(client):
    res = client.post("/notary/upload-pdf",
        files={"file": ("fake.pdf", b"NOT-A-PDF", "application/pdf")},
        data={
            "title": "Security Regression Manuscript",
            "author_name": "Test Scholar",
            "orcid": "0009-0003-3929-3605",
            "abstract": "magic bytes check",
            "formula_math": "",
            "has_human_subjects": "false",
        },
    )
    assert res.status_code == 415


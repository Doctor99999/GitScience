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
    review_id = ok_res.json().get("review_id")
    assert review_id

    # Публичный список НЕ раскрывает слепого рецензента (приватность)
    listed = client.get("/api/v1/review/list/GS-2026-00001").json()["reviews"]
    for r in listed:
        assert "reviewer_orcid" not in r
        assert "reviewer_blind_hash" in r

def test_review_reputation_and_attestation_claim(client):
    """Репутация рецензента + claim attestation (ResearchHub-style verifiable meritocracy)."""
    reviewer = "0009-0007-7788-9900"
    header = _auth_header_for(client, reviewer)

    # Пустая репутация → 404
    empty = client.get(f"/api/v1/review/reputation/{reviewer}")
    assert empty.status_code == 404

    res = client.post("/api/v1/review/submit", headers=header, json={
        "target_code": "GS-2026-00001",
        "reviewer_orcid": reviewer,
        "math_rigor_score": 8, "methodology_score": 7,
        "ethics_score": 9, "novelty_score": 8,
        "review_comments": "Methodologically sound design.",
    })
    assert res.status_code == 200
    review_id = res.json()["review_id"]

    rep = client.get(f"/api/v1/review/reputation/{reviewer}").json()
    assert rep["reviews_submitted"] == 1
    assert rep["mean_composite_score"] is not None
    assert rep["reviewer_verified"] is False

    # Чужая claim → 403
    stranger = client.post("/api/v1/review/claim", headers=_auth_header_for(client, "0009-0001-0000-0000"),
                           json={"review_id": review_id})
    assert stranger.status_code == 403

    # Своя claim → ATTESTATION_ISSUED
    claim = client.post("/api/v1/review/claim", headers=header, json={"review_id": review_id})
    assert claim.status_code == 200
    att_hash = claim.json()["attestation"]["attestation_sha256"]
    assert att_hash

    # Повторная claim → idempotent
    again = client.post("/api/v1/review/claim", headers=header, json={"review_id": review_id})
    assert again.json()["status"] == "ATTESTATION_ALREADY_CLAIMED"

    # Верификация attestation
    verify = client.get(f"/api/v1/review/attestation/{att_hash}").json()
    assert verify["status"] == "ATTESTATION_VALID"
    assert verify["matches_registry"] is True

    # Репутация обновилась: verified теперь True
    rep2 = client.get(f"/api/v1/review/reputation/{reviewer}").json()
    assert rep2["reviewer_verified"] is True
    assert rep2["claimed_attestations_count"] == 1

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
        assert res_ok.json()["status"] == "PAYMENT_ACKNOWLEDGED_AWAITING_SETTLEMENT"
        assert res_ok.json()["on_chain_bridge"] is None  # честность: ончейн-мост НЕ имитируется
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

# =====================================================================
# STATS HONESTY & SCIENCE COURT ON DB (Post-refactor regression)
# =====================================================================

def test_stats_summary_honest_metrics(client):
    """Метрики только из реальных источников — без выдуманных констант."""
    res = client.get("/api/v1/stats/summary")
    assert res.status_code == 200
    data = res.json()
    # Неотслеживаемые «живые» показатели не выдаются
    for fabricated in ("total_maas_executions", "total_verified_scholars",
                       "active_consensus_nodes", "total_peer_reviews_conducted"):
        assert fabricated not in data, f"fabricated metric leaked: {fabricated}"
    assert data["total_notarized_manuscripts"] >= 0
    assert data["total_ledger_transactions"] >= 0
    assert data["total_court_arbitrations"] >= 0
    assert data["blockchain_attestation_status"].startswith(
        ("OTS_PROOFS_FILES:", "NO_LIVE_BITCOIN_ANCHOR_YET")
    )

def test_court_dispute_full_flow_and_quorum(client):
    """Полный цикл суда: подача иска + 5 голосов присяжных до кворума (на БД)."""
    claimant = _auth_header_for(client, "0009-0003-3929-3605", "Claimant Scholar")
    filed = client.post("/api/v1/court/dispute", headers=claimant, json={
        "claimant_name": "Claimant Scholar",
        "claimant_orcid": "0009-0003-3929-3605",
        "target_code": "GS-2026-00001",
        "reason": "Плагиат методологии в производной формуле.",
        "evidence_hash": "0x" + _hashlib.sha256(b"evidence").hexdigest(),
    })
    assert filed.status_code == 200
    case = filed.json()["case"]
    case_id = case["case_id"]
    assert case["status"] == "OPEN"

    jurors = ["0009-0001-1111-1111", "0009-0001-2222-2222", "0009-0001-3333-3333",
              "0009-0001-4444-4444", "0009-0001-5555-5555"]
    for juror in jurors:
        res = client.post("/api/v1/court/vote", headers=_auth_header_for(client, juror), json={
            "case_id": case_id, "juror_orcid": juror, "vote": "valid"
        })
        assert res.status_code == 200, res.text
        assert res.json()["status"] == "VOTE_RECORDED"

    # Дубликат голоса отклоняется (составной PK)
    dup = client.post("/api/v1/court/vote", headers=_auth_header_for(client, jurors[0]), json={
        "case_id": case_id, "juror_orcid": jurors[0], "vote": "valid"
    })
    assert dup.status_code == 200
    assert dup.json()["status"] == "ERROR"

    # Кворум достигнут (5 valid > 0 invalid)
    final = client.get("/api/v1/court/cases").json()["cases"]
    case_final = next(c for c in final if c["case_id"] == case_id)
    assert case_final["status"] == "VERDICT_PRIOR_ART_CHALLENGED"
    assert case_final["votes"]["valid"] == 5

def test_billing_pay_requires_auth(client):
    """billing/pay — фейковый ончейн-леджер теперь защищён и честен."""
    payload = {
        "base_amount": 1000.0,
        "contributors": [{"orcid": "0009-0003-3929-3605", "role": "author", "share_pct": 60.0}]
    }

    anon = client.post("/api/v1/billing/pay", json=payload)
    assert anon.status_code == 401

    authed = client.post("/api/v1/billing/pay", headers=_auth_header_for(client, "0009-0003-3929-3605"), json=payload)
    assert authed.status_code == 200
    data = authed.json()
    assert data["transaction_hash"].startswith("SIMULATED-OFFCHAIN:")

def test_vampire_import_requires_auth(client):
    """vampire/import — SSRF-вектор теперь требует валидный Bearer-токен."""
    res = client.post("/api/v1/vampire/import", json={
        "work_data": {"title": "Untitled", "authors": "Anon", "license": "cc-by"}
    })
    assert res.status_code == 401
    assert "Authorization" in res.json()["detail"]


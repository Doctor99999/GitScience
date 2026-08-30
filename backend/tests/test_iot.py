# -*- coding: utf-8 -*-
"""Tests for the IoT Hardware Gateway (HSM) — signature validation & anti-replay."""
import importlib
import json
import time

import pytest

from gitscience_iot import GitscienceIoTGateway, REPLAY_WINDOW_SECONDS


@pytest.fixture(autouse=True)
def isolated_gateway(tmp_path):
    """Изолированный шлюз на время теста (без общего storage)."""
    g = GitscienceIoTGateway(tmp_path)
    yield g


def _spawn_device(g: GitscienceIoTGateway):
    """Регистрирует устройство и возвращает его приватный ключ (PEM)."""
    kp = g.generate_keypair()
    g.register_device("HPLC-01", "Agilent HPLC", kp["public_key_pem"])
    return kp["private_key_pem"]


def test_register_and_list_devices(isolated_gateway):
    kp = isolated_gateway.generate_keypair()
    isolated_gateway.register_device("PACE-01", "Tecan Pro", kp["public_key_pem"])
    devs = isolated_gateway.list_devices()
    assert any(d["device_id"] == "PACE-01" for d in devs)


def test_valid_signed_ingest(isolated_gateway):
    priv = _spawn_device(isolated_gateway)
    payload = {"sample_id": "S-1001", "signal": 0.987, "unit": "AU"}
    now = int(time.time())
    rec = {
        "device_id": "HPLC-01",
        "timestamp": now,
        "nonce": "n-abcdef123",
        "payload": payload,
        "signature": isolated_gateway.sign_payload(payload, priv),
    }
    res = isolated_gateway.ingest(rec)
    assert res["status"] == "VERIFIED"
    assert res["content_sha256"]  # дайджест → якорение в нотариат
    assert res["ots_status"] == "PENDING_BITCOIN_CALENDAR_SUBMISSION"


def test_tampered_payload_rejected(isolated_gateway):
    priv = _spawn_device(isolated_gateway)
    payload = {"sample_id": "S-1001", "signal": 0.987}
    now = int(time.time())
    tampered = {"sample_id": "S-1001", "signal": 0.999}  # подмена результата человеком
    rec = {
        "device_id": "HPLC-01",
        "timestamp": now,
        "nonce": "n-tamper-0001",
        "payload": tampered,
        "signature": isolated_gateway.sign_payload(payload, priv),
    }
    res = isolated_gateway.ingest(rec)
    assert res["status"] == "REJECTED"
    assert res["reason"] == "INVALID_SIGNATURE"


def test_replay_nonce_rejected(isolated_gateway):
    priv = _spawn_device(isolated_gateway)
    payload = {"sample_id": "S-2000", "value": 42}
    now = int(time.time())
    rec = {
        "device_id": "HPLC-01",
        "timestamp": now,
        "nonce": "n-replay-0007",
        "payload": payload,
        "signature": isolated_gateway.sign_payload(payload, priv),
    }
    assert isolated_gateway.ingest(rec)["status"] == "VERIFIED"
    assert isolated_gateway.ingest(rec)["reason"] == "REPLAY_NONCE_ALREADY_SEEN"


def test_stale_timestamp_rejected(isolated_gateway):
    priv = _spawn_device(isolated_gateway)
    payload = {"x": 1}
    old = int(time.time()) - REPLAY_WINDOW_SECONDS - 60
    rec = {
        "device_id": "HPLC-01",
        "timestamp": old,
        "nonce": "n-stale-0003",
        "payload": payload,
        "signature": isolated_gateway.sign_payload(payload, priv),
    }
    res = isolated_gateway.ingest(rec)
    assert res["status"] == "REJECTED"
    assert res["reason"].startswith("TIMESTAMP_OUT_OF_WINDOW")


def test_unregistered_device_rejected(isolated_gateway):
    payload = {"x": 1}
    rec = {
        "device_id": "UNREG-99",
        "timestamp": int(time.time()),
        "nonce": "n-notev-0009",
        "payload": payload,
        "signature": "c2lnbmF0dXJl",
    }
    res = isolated_gateway.ingest(rec)
    assert res["status"] == "REJECTED"
    assert res["reason"] == "DEVICE_UNREGISTERED_OR_INACTIVE"

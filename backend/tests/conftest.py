"""
conftest.py — общие фикстуры для test suite.

Rate limiter: персистентный (диск + память) Singleton из main.py. Тестовый процесс
на `127.0.0.1` быстро исчерпывает бюджет 120 req/60s, что ломает весь smoke-suite.
Сбрасываем счётчики лимитера между тестами (функциональность RBAC не затрагивается).
"""
import pytest


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    import main as main_mod
    main_mod.rate_limiter.requests.clear()
    yield
    main_mod.rate_limiter.requests.clear()
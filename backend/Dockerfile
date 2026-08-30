FROM python:3.11-slim

# Git нужен для реальных notarization-коммитов (GitPython). libpq не требуется: psycopg2-binary.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Непривилегированный пользователь (контейнер не запускается от root)
RUN useradd --uid 10001 --create-home appuser \
    && mkdir -p /app/storage \
    && chown -R appuser:appuser /app

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

# Healthcheck без curl (штатный python-клиент)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD ["python", "-c", "import urllib.request as u; u.urlopen('http://127.0.0.1:8000/api/v1/health', timeout=4)"]

# Production: gunicorn + uvicorn workers.
# --proxy-headers + forwarded-allow-ips: доверяем обратному прокси (nginx/Render) —
# реальный IP клиента попадает в request.client.host для rate limiter и логов.
CMD ["sh", "-c", "gunicorn -w 2 -k uvicorn.workers.UvicornWorker --timeout 120 --keep-alive 5 --forwarded-allow-ips='*' main:app --bind 0.0.0.0:${PORT:-8000}"]

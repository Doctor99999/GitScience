FROM python:3.11-slim

# Системные зависимости: Git (нотариат), libpq-dev (PostgreSQL драйвер)
RUN apt-get update && apt-get install -y \
    git \
    libpq-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Дополнительные production-пакеты
RUN pip install --no-cache-dir \
    psycopg2-binary \
    boto3 \
    python-dotenv \
    sqlalchemy

COPY . .

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Healthcheck для Docker/оркестраторов
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Запуск в production: gunicorn + uvicorn workers с таймаутами и keep-alive
CMD ["sh", "-c", "gunicorn -w 2 -k uvicorn.workers.UvicornWorker --timeout 120 --keep-alive 5 main:app --bind 0.0.0.0:${PORT:-8000}"]
# GitScience™ Sovereign Protocol API Node
FROM python:3.11-slim

# Установка системного Git (необходим для Git-нотариата и OID)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование всех файлов
COPY . .

# Переменные окружения
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Запуск с надежным таймаутом 120с и 2 воркерами (защита от OOM на Render)
CMD ["sh", "-c", "gunicorn -w 2 -k uvicorn.workers.UvicornWorker --timeout 120 --keep-alive 5 server:app --bind 0.0.0.0:${PORT:-8000}"]
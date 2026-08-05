# Автономная децентрализованная нода GitScience™ Node
FROM python:3.11-slim

WORKDIR /app

# Установка системного Git и зависимостей
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "server.py"]
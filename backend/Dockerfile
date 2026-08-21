# 1. Используем легкий официальный образ Linux с Python 3.10
FROM python:3.10-slim

# 2. КРИТИЧЕСКИ ВАЖНО: Устанавливаем системный Git (нужен для движка GitScience)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# 3. Устанавливаем рабочую папку внутри контейнера
WORKDIR /app

# 4. Копируем список зависимостей
COPY requirements.txt .

# 5. Устанавливаем Python-библиотеки
RUN pip install --no-cache-dir -r requirements.txt

# 6. Копируем все остальные файлы бэкенда внутрь контейнера
COPY . .

# 7. Открываем порт для Render
EXPOSE 8000

# 8. Команда запуска сервера с 4 worker-процессами для высоких нагрузок на Render
CMD ["sh", "-c", "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:${PORT:-8000}"]
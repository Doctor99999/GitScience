# 🚀 Полный план вывода GitScience в боевой режим (Mainnet Launch)

Чтобы проект работал идеально, без падений под нагрузкой и проблем с безопасностью, запуск должен проходить строго по инженерным стандартам. Ниже представлен исчерпывающий пошаговый план развертывания (Production Rollout Plan).

---

## Этап 1: Подготовка Инфраструктуры (Hardware & Network)

1. **Аренда VPS/VDS (Виртуальный сервер)**
   - **Рекомендуемые провайдеры:** Hetzner (дешево/мощно), DigitalOcean, AWS EC2.
   - **Минимальные требования:** 4 vCPU, 8 GB RAM, 80-100 GB NVMe SSD.
   - *Почему так:* Celery-воркеры для обработки PDF и база PostgreSQL требуют оперативной памяти. Меньше 4 ГБ приведет к остановке базы данных из-за OOM (Out Of Memory).

2. **Настройка домена и CDN (Cloudflare)**
   - Зарегистрируйте домен (например, `gitscience.org`).
   - Подключите его к **Cloudflare** (бесплатный тариф).
   - Включите проксирование (оранжевое облако) для защиты от прямых DDoS-атак и кэширования статики Next.js.
   - В Cloudflare включите "Strict SSL".

---

## Этап 2: Настройка внешних интеграций (Хранилище и Авторизация)

1. **Регистрация ORCID API (Production)**
   - Перейдите в портал разработчиков ORCID.
   - Добавьте ваш боевой домен в список разрешенных `Redirect URIs` (например, `https://gitscience.org/api/v1/auth/orcid/callback`).
   - Получите боевые `ORCID_CLIENT_ID` и `ORCID_CLIENT_SECRET`.

2. **Подключение S3 / Cloudflare R2 (Критично для PDF)**
   - PDF-файлы весят до 50 МБ. Локальный диск VPS быстро переполнится.
   - Создайте бакет в **Cloudflare R2** (дешевле AWS, бесплатный исходящий трафик).
   - Запишите доступы: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_ENDPOINT_URL`.

---

## Этап 3: Подготовка сервера и развертывание (Деплой)

1. **Базовая защита сервера (Firewall)**
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```

2. **Установка Docker и Git**
   Установите `docker`, `docker-compose` и клонируйте репозиторий проекта на сервер.

3. **Настройка боевого окружения (`.env`)**
   В корне проекта создайте файл `.env` со строгими паролями:
   ```env
   POSTGRES_PASSWORD=Сгенерируйте_Сложный_Пароль_1
   REDIS_PASSWORD=Сгенерируйте_Сложный_Пароль_2
   JWT_SECRET=Длинная_Криптографическая_Строка_Для_Токенов
   ORCID_CLIENT_ID=ваш_ид
   ORCID_CLIENT_SECRET=ваш_секрет
   AWS_ACCESS_KEY_ID=ваш_ключ_r2
   AWS_SECRET_ACCESS_KEY=ваш_секрет_r2
   ```

4. **Генерация SSL-сертификатов (Let's Encrypt)**
   Nginx в контейнере ожидает сертификаты. Сгенерируйте их на хосте:
   ```bash
   sudo apt install certbot
   sudo certbot certonly --standalone -d gitscience.org
   # Скопируйте сертификаты в папку nginx/certs проекта
   cp /etc/letsencrypt/live/gitscience.org/fullchain.pem ./nginx/certs/
   cp /etc/letsencrypt/live/gitscience.org/privkey.pem ./nginx/certs/
   ```

5. **Запуск всего кластера (Ignition)**
   ```bash
   docker-compose up -d --build
   ```

---

## Этап 4: Верификация и Мониторинг

1. **Проверка здоровья контейнеров (Healthchecks)**
   - Выполните `docker-compose ps`. Все 5 контейнеров (`nginx`, `db`, `redis`, `backend`, `worker`, `frontend`) должны иметь статус `Up (healthy)`.
   - Проверьте логи на отсутствие ошибок инициализации: `docker-compose logs -f`.

2. **Проверка работоспособности системы**
   - **Авторизация:** Попробуйте войти через ORCID.
   - **Сбор PDF (Vampire Harvester):** Попробуйте запустить поиск статьи (например, "Oncology") через дашборд. Убедитесь, что Celery-воркер подхватил задачу, скачал PDF и положил его в базу.
   - **Smart Contracts (Опционально):** Убедитесь, что ваш крипто-кошелек может взаимодействовать с блокчейном через клиент.

3. **Настройка Автоматических Бэкапов (Cron)**
   - Настройте ежедневный дамп базы данных Postgres и отправку его в S3:
   ```bash
   # Пример скрипта для crontab (каждый день в 03:00)
   0 3 * * * docker exec gitscience_postgres pg_dump -U gitscience gitscience_db > /backup/db_$(date +\%F).sql
   ```

## Этап 5: План дальнейшего масштабирования (Day 2 Operations)

Когда платформа наберет первые 10,000 пользователей:
1. Вынести **PostgreSQL** и **Redis** на управляемые облачные сервисы (Managed Databases от AWS/DigitalOcean).
2. Настроить **CI/CD** через GitHub Actions для автоматического обновления контейнеров при пуше в `main` (нужен инструмент вроде Watchtower или скрипт деплоя).
3. Добавить **Prometheus + Grafana** для мониторинга нагрузки (CPU/RAM) и задержек API.

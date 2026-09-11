# GitScience Enterprise Deployment Guide

This guide covers deploying GitScience on a Virtual Private Server (VPS) such as DigitalOcean, AWS EC2, or Hetzner using Docker Compose.

## Prerequisites
- A Linux VPS (Ubuntu 22.04 or 24.04 recommended) with at least 4GB RAM and 2 vCPUs.
- Domain name (e.g., `gitscience.org`) pointed to your VPS IP address.
- `git`, `docker`, and `docker-compose` installed on the server.

## 1. Clone the Repository
```bash
git clone https://github.com/GitScience/GitScience.git
cd GitScience
```

## 2. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
nano .env
```
Ensure you set the following secure values:
- `POSTGRES_PASSWORD`: A strong password for PostgreSQL.
- `REDIS_PASSWORD`: A strong password for Redis.
- `JWT_SECRET`: A cryptographic key for Scholar Passport generation.
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`: Credentials for AWS S3 / Cloudflare R2 (for PDF Vault storage).

## 3. Launch the Stack
GitScience utilizes an Enterprise-grade architecture out of the box:
- **Nginx**: Reverse Proxy & Static Caching
- **Next.js**: Frontend SSR Application
- **FastAPI**: Backend Core API
- **Celery**: Background workers for PDF processing
- **Redis**: Job Queue & Caching Broker
- **PostgreSQL 16**: Relational Database for immutable metadata

Run the entire cluster:
```bash
docker-compose up -d --build
```

## 4. Verify Services
Check that all 5 containers are running healthily:
```bash
docker-compose ps
```
You should see `db`, `redis`, `backend`, `worker`, and `frontend` all showing `Up`.

## 5. SSL & Domain (Optional but Recommended)
If deploying to production, install `certbot` and configure Nginx to use SSL:
```bash
sudo apt install python3-certbot-nginx
sudo certbot --nginx -d gitscience.org
```

## Continuous Integration (CI/CD)
The `.github/workflows/` directory contains automatic actions:
- `ci.yml`: Runs `pytest`, `pip-audit`, and `npm audit` on every Pull Request.
- `deploy.yml`: Automatically builds static Next.js assets to GitHub Pages (if frontend-only deployment is desired).

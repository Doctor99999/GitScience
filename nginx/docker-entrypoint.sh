#!/bin/sh
# GitScience™ nginx entrypoint
# Если SSL-сертификаты не смонтированы (staging/dev) — генерируем self-signed,
# чтобы 443 всегда поднимался. В проде смонтируйте реальные сертификаты:
#   volumes:
#     - ./certs/fullchain.pem:/etc/nginx/certs/fullchain.pem:ro
#     - ./certs/privkey.pem:/etc/nginx/certs/privkey.pem:ro

set -e

CERT_DIR=/etc/nginx/certs
FULLCHAIN="$CERT_DIR/fullchain.pem"
PRIVKEY="$CERT_DIR/privkey.pem"

if [ ! -f "$FULLCHAIN" ] || [ ! -f "$PRIVKEY" ]; then
    echo "[nginx-entrypoint] SSL сертификаты не найдены — генерирую self-signed (STAGING MODE)"
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
        -keyout "$PRIVKEY" -out "$FULLCHAIN" \
        -subj "/C=KZ/L=Astana/O=GitScience/CN=gitscience.org" >/dev/null 2>&1
fi

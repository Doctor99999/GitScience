FROM nginx:1.25-alpine

# openssl для self-signed fallback в entrypoint (staging)
RUN apk add --no-cache openssl

# Основной конфиг с Rate Limiting, Security headers и HTTPS 443
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-gitscience-certs.sh

RUN chmod +x /docker-entrypoint.d/40-gitscience-certs.sh \
    && mkdir -p /var/cache/nginx /etc/nginx/certs \
    && chown -R nginx:nginx /var/cache/nginx

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

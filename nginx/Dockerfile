FROM nginx:1.25-alpine

# Копируем кастомный конфиг с Rate Limiting и Security заголовками
COPY nginx.conf /etc/nginx/nginx.conf

# Создаем директорию для кэша и логов, если необходимо
RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM node:20-alpine AS builder

WORKDIR /app

# Установка зависимостей
COPY package.json package-lock.json* ./
RUN npm ci

# Копирование исходного кода
COPY . .

# Сборка Next.js приложения (standalone output)
RUN npm run build

# ——— Production runner ———
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Копируем standalone-сборку
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]

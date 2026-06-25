# Multi-stage: build React UI, then run Express API serving the SPA
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0
ENV TRADECRM_STATIC_DIR=/app/frontend/dist
ENV UPLOAD_DIR=/app/uploads

EXPOSE 4000
VOLUME ["/app/uploads"]

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]

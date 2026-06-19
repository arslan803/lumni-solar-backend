FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
ARG CACHEBUST=1
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev --legacy-peer-deps && npx prisma generate
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 4000
CMD ["./docker-entrypoint.sh"]

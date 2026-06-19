FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts
COPY . .
RUN npm rebuild bcrypt --build-from-source
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts
COPY --from=builder /app/node_modules/bcrypt/lib/binding ./node_modules/bcrypt/lib/binding
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
EXPOSE 4000
CMD ["./docker-entrypoint.sh"]

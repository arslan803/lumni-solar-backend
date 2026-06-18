# Lumni Solar Backend API

NestJS REST API for the Lumni solar installer marketplace (Pakistan / Lahore pilot).

## Stack

- NestJS + TypeScript
- Prisma ORM
- PostgreSQL (Railway production)
- JWT auth
- JazzCash payment stubs

## Setup

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets

npm install --legacy-peer-deps
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

API: http://localhost:4000  
Swagger: http://localhost:4000/api/docs

## Production (Railway)

Set environment variables from `.env.production.example`.

Start command:
```bash
npm run build && npm run start:prod
```

Or use Docker:
```bash
docker build -t lumni-api .
```

## Important

- **Never commit `.env`** — it contains secrets
- Use Railway PostgreSQL `DATABASE_URL` in production
- Run `npx prisma migrate deploy` on first deploy

## Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lumni.pk | admin123 |
| Customer | customer@lumni.pk | customer123 |
| Installer | installer@lumni.pk | installer123 |

# PalatePass API

Express + TypeScript API workspace for authentication, restaurants, ratings, recommendations, and social graph features.

## Commands

- `npm run dev --workspace api`
- `npm run build --workspace api`
- `npm run check --workspace api`
- `npm run test --workspace api`
- `npm run test:watch --workspace api`
- `npm run prisma:generate --workspace api`
- `npm run prisma:migrate --workspace api`

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT`
- `CLIENT_URL`

## Supabase Setup

From Supabase Project Settings > Database > Connection string:

- Use Pooler Transaction mode (port 6543) for `DATABASE_URL`
- Use Pooler Session mode (port 5432) for `DIRECT_URL`
- Add `?sslmode=require` to both URLs

Then run migrations:

- `npm run prisma:generate --workspace api`
- `npm run prisma:migrate --workspace api -- --name init_auth_foundation`

## Current Endpoints

- `GET /health`
- `GET /api`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (requires `Authorization: Bearer <token>`)

## Example Request Bodies

`POST /auth/register`

```json
{
  "email": "testuser@palatepass.com",
  "password": "StrongPass123!",
  "displayName": "Test User"
}
```

`POST /auth/login`

```json
{
  "email": "testuser@palatepass.com",
  "password": "StrongPass123!"
}
```

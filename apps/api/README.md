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

### Health

- `GET /health`
- `GET /api`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (requires `Authorization: Bearer <token>`)

### Restaurants

- `GET /restaurants` — list with optional `?cuisine=`, `?city=`, `?page=`, `?limit=` filters
- `POST /restaurants` — create (auth required)
- `GET /restaurants/:id` — single restaurant with ratings
- `POST /restaurants/:id/ratings` — add or update rating (auth required; one rating per user per restaurant)

### Users

- `GET /users/:id` — public profile summary with rating stats and top cuisines
- `PATCH /users/me` — update profile fields (auth required)
- `POST /users/:id/follow` — follow a user (auth required)
- `DELETE /users/:id/follow` — unfollow a user (auth required)

### Recommendations

- `GET /recommendations/feed` — ranked recommendations from people you follow (auth required)
- `GET /recommendations/feed?limit=10` — same feed with custom result size

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

`POST /restaurants`

```json
{
  "name": "Bella Cucina",
  "address": "12 Olive St",
  "city": "London",
  "cuisine": "Italian",
  "lat": 51.5074,
  "lng": -0.1278
}
```

`POST /restaurants/:id/ratings`

```json
{
  "score": 4,
  "notes": "Great atmosphere and pasta!",
  "tags": ["cozy", "romantic"]
}
```

`PATCH /users/me`

```json
{
  "displayName": "Lia P",
  "bio": "Always chasing cozy pasta spots",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

`GET /recommendations/feed?limit=10`

Include header:

`Authorization: Bearer <token>`

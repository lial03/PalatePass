# PalatePass

Social restaurant discovery based on trusted people and taste matching.

## Vision

PalatePass helps users discover where to eat through people they trust, shared preferences, and smart recommendations. Instead of anonymous review feeds, the platform is centered on social taste graphs and shareable profiles.

## Problem Statement

Existing restaurant platforms often fail users because:

- Reviews from strangers are hard to trust
- Recommendations are often irrelevant
- Personal recommendations are not easy to share
- It is difficult to discover restaurants through people with similar tastes

PalatePass solves this by making discovery social, personalized, and shareable.

## Target Users

### Primary

- Students and young professionals
- Food enthusiasts
- Groups of friends deciding where to eat

### Secondary (Future Phase)

- Restaurants wanting visibility
- Food bloggers and influencers

## Platform Roadmap

- Phase 1: Web MVP
- Phase 2: Mobile app

## MVP Scope

### Accounts and Profiles

- Sign up and log in
- Basic profile with picture and bio
- Public profiles with ratings and top restaurants

### Public Profile Insights

- Average rating given
- Favorite cuisines
- Most visited restaurants
- Filterable reviews

### Restaurant Ratings

- 1-5 star ratings
- Short written reviews
- Review tags (cozy, spicy, affordable, fast service)

### Recommendations

- Nearby restaurants with strong ratings
- Similar restaurants to user favorites
- Restaurants liked by people a user follows

### Sharing

- QR code for profile
- QR code for a specific review
- Curated list QR (future phase)

## Differentiators

- Taste Match score between users
- Trusted circles (follow friends and aligned reviewers)
- Social discovery rather than anonymous ratings

## Core Social Features (Post-MVP Wave)

### Lists and Maps

- Users create and share lists (budget meals, date spots, weekend hangouts)
- Lists can be visualized on a map

### Real-World QR Rating

- Restaurants display in-store QR codes
- Users can scan and rate instantly from the location

## Suggested Tech Stack

- Frontend: Next.js (React) + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL (recommended for MVP)
- Integrations: QR code library, Google Maps API

## Monetization Ideas

- Sponsored restaurant placements, clearly labeled
- Premium user tier with advanced taste analytics and private lists
- Restaurant analytics dashboard (rating counts, trend insights, top tags)
- Affiliate partnerships (delivery and reservations)

## Competitive Advantage

PalatePass combines trust-based discovery, taste matching, and shareability in one experience, rather than relying only on anonymous star ratings.

## Expansion Ideas

- AI-generated taste profile
- Food event recommendations
- Group voting for where to eat
- Influencer-curated restaurant lists

## Monorepo Structure

```text
PalatePass/
  apps/
    web/
    api/
  docs/
  package.json
```

## Quick Start

1. Install Node.js 20+.
2. Run `npm install` at the repository root.
3. Run `npm run dev` to start the web app and API together.

## Workspace Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run check:api`

## CI/CD

GitHub Actions workflows are configured in `.github/workflows`:

- CI (`ci.yml`): runs on pushes and PRs for `main` and `develop`, and executes lint, API typecheck, and build.
- CD (`cd.yml`): runs on pushes to `main` and packages release artifacts only (no auto-deploy yet).

When you choose a hosting target later (for example Vercel, Render, Railway, Fly.io, or AWS), we can add a deployment job and the required repository secrets.

## Product Notes

Detailed planning extracted from the project brief is in `docs/product-brief.md`.

# PalatePass

Social restaurant discovery based on trusted people and taste matching.

## Vision

PalatePass helps users discover where to eat through people they trust, shared preferences, and smart recommendations. Instead of anonymous review feeds, the platform is centered on social taste graphs and shareable profiles.

## Platform Roadmap

- Phase 1: Web MVP
- Phase 2: Mobile app

## MVP Scope

### Accounts and Profiles

- Sign up and log in
- Basic profile with picture and bio
- Public profiles with ratings and top restaurants

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

## Differentiators

- Taste Match score between users
- Trusted circles (follow friends and aligned reviewers)
- Social discovery rather than anonymous ratings

## Suggested Tech Stack

- Frontend: Next.js (React) + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL (recommended for MVP)
- Integrations: QR code library, Google Maps API

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
3. Build web and API apps incrementally from the `apps/` folders.

## Product Notes

Detailed planning extracted from the project brief is in `docs/product-brief.md`.

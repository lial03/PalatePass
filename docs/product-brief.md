# PalatePass Product Brief

## Vision

Build a social restaurant-rating platform where people discover restaurants through trusted people, shared tastes, and smart recommendations.

Unlike traditional review apps, PalatePass emphasizes:

- Taste matching between users
- Recommendations based on real people, not anonymous reviews
- Easy profile and review sharing through QR codes

## Problem Statement

Existing restaurant review platforms have key challenges:

- Reviews from strangers are hard to trust
- Recommendations are often irrelevant
- Sharing personal recommendations is difficult
- Discovering restaurants through similar tastes is limited

PalatePass addresses this by making discovery social, personalized, and shareable.

## Target Users

### Primary Users

- Students and young professionals
- Food enthusiasts
- Friend groups deciding where to eat

### Secondary Users (Future Phase)

- Restaurants wanting visibility
- Food bloggers and influencers

## MVP Features

### User Accounts

- Registration and login
- Profile picture and bio

### Ratings and Reviews

- 1-5 star rating
- Short text reviews
- Tags (cozy, spicy, affordable, fast service)
- Average restaurant rating visibility

### Public Profiles

- View ratings by user
- Top restaurants
- Filter reviews
- Average rating given
- Favorite cuisines
- Most visited restaurants

### Recommendations

- Nearby highly rated options
- Similar-to-liked restaurants
- Restaurants liked by followed users

### QR Sharing

- Profile QR
- Review QR
- Curated list QR (future phase)

## Unique Features

### Taste Matching

Users get a taste compatibility score (example: Taste Match 78%) based on:

- Common highly rated restaurants
- Shared cuisines
- Similar tag usage

### Trusted Circles

- Follow friends
- Follow reviewers with similar taste
- See recommendation feeds from trusted people

### Lists and Maps

- Create lists like budget meals, date spots, and weekend hangouts
- Share lists
- Display lists on maps

### Real-World QR Rating

- Restaurants can display QR codes for instant on-site ratings

## Suggested MVP Architecture

- Frontend: Next.js + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL
- Services: QR generation, map integration

## Monetization Strategy (Brainstormed)

### Sponsored Restaurants

- Paid featured placements in discovery/search
- Must be clearly labeled as sponsored

### Premium User Features

- Advanced taste analytics and trends
- Private lists
- Deeper recommendations
- Profile customization and badges

### Restaurant Analytics Dashboard

- Monthly subscription for trend insights
- Rating volume and feedback trends
- Popular tag analytics

### Affiliate Deals

- Delivery platform partnerships
- Reservation platform partnerships
- Commission per booking/order

## Competitive Advantage

PalatePass differentiates with trust-first social discovery, taste matching, and shareable recommendation flows rather than anonymous ratings alone.

## Current MVP Snapshot

- Web app supports registration, login, restaurant browsing, ratings, social recommendations, and public user profiles.
- Taste Match is implemented as a user-to-user compatibility score based on shared restaurants, cuisines, and tags.
- Authentication is hardened with httpOnly cookies, JWT expiry handling, and inactivity logout.
- QR sharing is implemented for public profiles and individual reviews.

## Expansion Ideas

- AI taste profile
- Food event recommendations
- Group planning and voting
- Influencer restaurant lists

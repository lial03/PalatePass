import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const recommendationsRouter = Router();

type NetworkRating = {
  score: number;
  userId: string;
  notes: string | null;
  createdAt: Date;
  user: { id: string; displayName: string };
  restaurant: {
    id: string;
    name: string;
    address: string;
    city: string;
    cuisine: string;
    lat: number | null;
    lng: number | null;
  };
};

type RecommendationAggregate = {
  restaurantId: string;
  name: string;
  address: string;
  city: string;
  cuisine: string;
  lat: number | null;
  lng: number | null;
  endorsementCount: number;
  networkAverageScore: number;
  recommendationScore: number;
  endorsedBy: string[];
  sampleNotes: string[];
};

recommendationsRouter.get(
  "/feed",
  requireAuth,
  async (request: AuthenticatedRequest, response) => {
    const userId = request.authUser!.id;
    const requestedLimit = Number(request.query.limit) || 20;
    const limit = Math.min(50, Math.max(1, requestedLimit));

    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = follows.map((f: { followingId: string }) => f.followingId);

    if (followingIds.length === 0) {
      const globalRatings = await prisma.rating.findMany({
        where: { score: { gte: 4 } },
        include: {
          user: { select: { id: true, displayName: true } },
          restaurant: { select: { id: true, name: true, address: true, city: true, cuisine: true, lat: true, lng: true } },
        },
        orderBy: { score: "desc" },
        take: 100,
      });

      const gMap = new Map<string, RecommendationAggregate & { totalScore: number; endorsers: Set<string> }>();
      for (const rating of globalRatings as unknown as NetworkRating[]) {
        const key = rating.restaurant.id;
        const existing = gMap.get(key);
        if (!existing) {
          gMap.set(key, { ...rating.restaurant, restaurantId: rating.restaurant.id, endorsementCount: 1, networkAverageScore: rating.score, recommendationScore: rating.score, endorsedBy: [], sampleNotes: rating.notes ? [rating.notes] : [], totalScore: rating.score, endorsers: new Set([rating.user.displayName]) });
          continue;
        }
        existing.endorsementCount += 1;
        existing.totalScore += rating.score;
        existing.endorsers.add(rating.user.displayName);
        if (rating.notes && existing.sampleNotes.length < 3) existing.sampleNotes.push(rating.notes);
      }

      const discoveryFeed = [...gMap.values()].map(item => {
        const average = item.totalScore / item.endorsementCount;
        return {
          ...item,
          networkAverageScore: Math.round(average * 10) / 10,
          recommendationScore: Math.round((average * Math.log2(item.endorsementCount + 1)) * 10) / 10,
          endorsedBy: [...item.endorsers].slice(0, 5),
        };
      }).sort((a, b) => b.recommendationScore - a.recommendationScore).slice(0, limit);

      return response.json({
        data: discoveryFeed,
        meta: { followingCount: 0, candidateRatings: globalRatings.length, limit, isDiscoveryFallback: true },
      });
    }

    const networkRatings = (await prisma.rating.findMany({
      where: {
        userId: { in: followingIds },
        score: { gte: 4 },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            cuisine: true,
            lat: true,
            lng: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    })) as NetworkRating[];

    const aggregateMap = new Map<string, RecommendationAggregate & { totalScore: number; endorsers: Set<string> }>();

    for (const rating of networkRatings) {
      const key = rating.restaurant.id;
      const existing = aggregateMap.get(key);

      if (!existing) {
        aggregateMap.set(key, {
          restaurantId: rating.restaurant.id,
          name: rating.restaurant.name,
          address: rating.restaurant.address,
          city: rating.restaurant.city,
          cuisine: rating.restaurant.cuisine,
          lat: rating.restaurant.lat,
          lng: rating.restaurant.lng,
          endorsementCount: 1,
          networkAverageScore: rating.score,
          recommendationScore: rating.score,
          endorsedBy: [],
          sampleNotes: rating.notes ? [rating.notes] : [],
          totalScore: rating.score,
          endorsers: new Set([rating.user.displayName]),
        });
        continue;
      }

      existing.endorsementCount += 1;
      existing.totalScore += rating.score;
      existing.endorsers.add(rating.user.displayName);
      if (rating.notes && existing.sampleNotes.length < 3) {
        existing.sampleNotes.push(rating.notes);
      }
    }

    const recommendations = [...aggregateMap.values()]
      .map((item) => {
        const average = item.totalScore / item.endorsementCount;
        const recommendationScore = Math.round((average * Math.log2(item.endorsementCount + 1)) * 10) / 10;

        return {
          restaurantId: item.restaurantId,
          name: item.name,
          address: item.address,
          city: item.city,
          cuisine: item.cuisine,
          lat: item.lat,
          lng: item.lng,
          endorsementCount: item.endorsementCount,
          networkAverageScore: Math.round(average * 10) / 10,
          recommendationScore,
          endorsedBy: [...item.endorsers].slice(0, 5),
          sampleNotes: item.sampleNotes,
        };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    response.json({
      data: recommendations,
      meta: {
        followingCount: followingIds.length,
        candidateRatings: networkRatings.length,
        limit,
      },
    });
  },
);

export { recommendationsRouter };


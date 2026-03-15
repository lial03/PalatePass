import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

const usersRouter = Router();

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().max(500).optional(),
});

usersRouter.get("/:id", async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.params.id },
    select: {
      id: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          ratings: true,
        },
      },
      ratings: {
        select: {
          score: true,
          restaurant: {
            select: {
              cuisine: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  const averageRating =
    user.ratings.length > 0
      ? Math.round(
          (user.ratings.reduce((sum: number, rating: { score: number }) => sum + rating.score, 0) /
            user.ratings.length) *
            10,
        ) / 10
      : null;

  const cuisineFrequency = new Map<string, number>();
  for (const rating of user.ratings as Array<{ restaurant: { cuisine: string } }>) {
    const cuisine = rating.restaurant.cuisine;
    cuisineFrequency.set(cuisine, (cuisineFrequency.get(cuisine) ?? 0) + 1);
  }

  const favoriteCuisines = [...cuisineFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cuisine]) => cuisine);

  response.json({
    profile: {
      id: user.id,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      stats: {
        followersCount: user._count.followers,
        followingCount: user._count.following,
        ratingsCount: user._count.ratings,
        averageRating,
        favoriteCuisines,
      },
    },
  });
});

usersRouter.patch("/me", requireAuth, async (request: AuthenticatedRequest, response) => {
  const parsed = updateProfileSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  if (Object.keys(parsed.data).length === 0) {
    response.status(400).json({ message: "At least one field is required" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: request.authUser!.id },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      updatedAt: true,
    },
  });

  response.json({ user: updated });
});

usersRouter.post("/:id/follow", requireAuth, async (request: AuthenticatedRequest, response) => {
  const followerId = request.authUser!.id;
  const followingId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;

  if (followerId === followingId) {
    response.status(400).json({ message: "You cannot follow yourself" });
    return;
  }

  const targetUser = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });

  if (!targetUser) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
    update: {},
    create: {
      followerId,
      followingId,
    },
  });

  response.status(201).json({ message: "Followed user" });
});

usersRouter.delete("/:id/follow", requireAuth, async (request: AuthenticatedRequest, response) => {
  const followerId = request.authUser!.id;
  const followingId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;

  if (followerId === followingId) {
    response.status(400).json({ message: "You cannot unfollow yourself" });
    return;
  }

  await prisma.follow.deleteMany({
    where: {
      followerId,
      followingId,
    },
  });

  response.status(204).send();
});

usersRouter.get("/:id/taste-match", requireAuth, async (request: AuthenticatedRequest, response) => {
  const meId = request.authUser!.id;
  const otherId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;

  if (meId === otherId) {
    response.status(400).json({ message: "Cannot compute taste match with yourself" });
    return;
  }

  const otherUser = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true } });
  if (!otherUser) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  const [myRatings, theirRatings] = await Promise.all([
    prisma.rating.findMany({
      where: { userId: meId },
      select: {
        restaurantId: true,
        score: true,
        tags: { select: { name: true } },
        restaurant: { select: { cuisine: true } },
      },
    }),
    prisma.rating.findMany({
      where: { userId: otherId },
      select: {
        restaurantId: true,
        score: true,
        tags: { select: { name: true } },
        restaurant: { select: { cuisine: true } },
      },
    }),
  ]);

  type RatingRow = (typeof myRatings)[number];

  if (myRatings.length === 0 || theirRatings.length === 0) {
    response.json({ score: 0 });
    return;
  }

  // 1. Restaurant similarity (40%): rating closeness × overlap ratio
  const myMap = new Map<string, number>(myRatings.map((r: RatingRow) => [r.restaurantId, r.score]));
  const theirMap = new Map<string, number>(theirRatings.map((r: RatingRow) => [r.restaurantId, r.score]));
  const commonIds = [...myMap.keys()].filter((id) => theirMap.has(id));
  const totalUnique = new Set([...myMap.keys(), ...theirMap.keys()]).size;

  let restaurantScore = 0;
  if (commonIds.length > 0) {
    const avgSimilarity =
      commonIds.reduce((sum: number, id) => sum + 1 - Math.abs(myMap.get(id)! - theirMap.get(id)!) / 4, 0) /
      commonIds.length;
    restaurantScore = avgSimilarity * (commonIds.length / totalUnique);
  }

  // 2. Cuisine overlap (35%): Jaccard similarity
  const myCuisines = new Set(myRatings.map((r: RatingRow) => r.restaurant.cuisine));
  const theirCuisines = new Set(theirRatings.map((r: RatingRow) => r.restaurant.cuisine));
  const cuisineIntersection = [...myCuisines].filter((c) => theirCuisines.has(c)).length;
  const cuisineUnion = new Set([...myCuisines, ...theirCuisines]).size;
  const cuisineScore = cuisineUnion > 0 ? cuisineIntersection / cuisineUnion : 0;

  // 3. Tag overlap (25%): Jaccard similarity
  const myTags = new Set(myRatings.flatMap((r: RatingRow) => r.tags.map((t: { name: string }) => t.name)));
  const theirTags = new Set(theirRatings.flatMap((r: RatingRow) => r.tags.map((t: { name: string }) => t.name)));
  const tagUnion = new Set([...myTags, ...theirTags]).size;
  const tagScore =
    tagUnion > 0 ? [...myTags].filter((t) => theirTags.has(t)).length / tagUnion : 0;

  const score = Math.round((restaurantScore * 0.4 + cuisineScore * 0.35 + tagScore * 0.25) * 100);

  response.json({ score });
});

export { usersRouter };


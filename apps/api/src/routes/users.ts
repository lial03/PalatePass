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

export { usersRouter };


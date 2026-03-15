import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

type RestaurantListRow = {
  id: string; name: string; address: string; city: string; cuisine: string;
  lat: number | null; lng: number | null; createdBy: string; createdAt: Date;
  _count: { ratings: number };
  ratings: { score: number }[];
};

type RatingRow = {
  id: string; score: number; notes: string | null; userId: string; createdAt: Date;
  user: { id: string; displayName: string };
  tags: { name: string }[];
};

type TagName = { name: string };

const restaurantsRouter = Router();

const createRestaurantSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1),
  city: z.string().min(1).max(80),
  cuisine: z.string().min(1).max(60),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

const createRatingSchema = z.object({
  score: z.number().int().min(1).max(5),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().min(1).max(40)).max(10).default([]),
});

// GET /restaurants — list with optional filters and pagination
restaurantsRouter.get("/", async (request, response) => {
  const cuisine = typeof request.query.cuisine === "string" ? request.query.cuisine : undefined;
  const city = typeof request.query.city === "string" ? request.query.city : undefined;
  const page = Math.max(1, Number(request.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 20));
  const skip = (page - 1) * limit;

  const where = {
    ...(cuisine ? { cuisine: { equals: cuisine, mode: "insensitive" as const } } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
  };

  const total = await prisma.restaurant.count({ where });
  const restaurants = await prisma.restaurant.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { ratings: true } }, ratings: { select: { score: true } } },
  });

  const data = (restaurants as RestaurantListRow[]).map((r) => {
    const avg =
      r.ratings.length > 0
        ? r.ratings.reduce((sum: number, rt: { score: number }) => sum + rt.score, 0) / r.ratings.length
        : null;
    return {
      id: r.id,
      name: r.name,
      address: r.address,
      city: r.city,
      cuisine: r.cuisine,
      lat: r.lat,
      lng: r.lng,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      averageScore: avg !== null ? Math.round(avg * 10) / 10 : null,
      ratingCount: r._count.ratings,
    };
  });

  response.json({ data, total, page, limit });
});

// POST /restaurants — create (auth required)
restaurantsRouter.post("/", requireAuth, async (request: AuthenticatedRequest, response) => {
  const parsed = createRestaurantSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      ...parsed.data,
      createdBy: request.authUser!.id,
    },
  });

  response.status(201).json({ restaurant });
});

// GET /restaurants/:id — single restaurant with rating summary
restaurantsRouter.get("/:id", async (request, response) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: request.params.id },
    include: {
      ratings: {
        include: {
          user: { select: { id: true, displayName: true } },
          tags: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!restaurant) {
    response.status(404).json({ message: "Restaurant not found" });
    return;
  }

  const avgScore =
    restaurant.ratings.length > 0
      ? (restaurant.ratings as RatingRow[]).reduce((sum: number, r) => sum + r.score, 0) / restaurant.ratings.length
      : null;

  response.json({
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      city: restaurant.city,
      cuisine: restaurant.cuisine,
      lat: restaurant.lat,
      lng: restaurant.lng,
      createdBy: restaurant.createdBy,
      createdAt: restaurant.createdAt,
      averageScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
      ratingCount: restaurant.ratings.length,
    },
    ratings: (restaurant.ratings as RatingRow[]).map((r) => ({
      id: r.id,
      score: r.score,
      notes: r.notes,
      tags: r.tags.map((t: TagName) => t.name),
      userId: r.userId,
      displayName: r.user.displayName,
      createdAt: r.createdAt,
    })),
  });
});

// POST /restaurants/:id/ratings — add or update rating (auth required)
restaurantsRouter.post(
  "/:id/ratings",
  requireAuth,
  async (request: AuthenticatedRequest, response) => {
    const parsed = createRatingSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: request.params.id } });

    if (!restaurant) {
      response.status(404).json({ message: "Restaurant not found" });
      return;
    }

    const { score, notes, tags } = parsed.data;
    const userId = request.authUser!.id;
    const restaurantId = restaurant.id;

    // Upsert tags
    const tagRecords = await Promise.all(
      tags.map((name) =>
        prisma.tag.upsert({
          where: { name: name.toLowerCase() },
          update: {},
          create: { name: name.toLowerCase() },
        }),
      ),
    );

    // Upsert the rating (one per user per restaurant)
    const existing = await prisma.rating.findUnique({
      where: { userId_restaurantId: { userId, restaurantId } },
      include: { tags: { select: { id: true } } },
    });

    let rating;
    if (existing) {
      rating = await prisma.rating.update({
        where: { id: existing.id },
        data: {
          score,
          notes: notes ?? null,
          tags: { set: tagRecords.map((t) => ({ id: t.id })) },
        },
        include: { tags: { select: { name: true } } },
      });
    } else {
      rating = await prisma.rating.create({
        data: {
          score,
          notes: notes ?? null,
          userId,
          restaurantId,
          tags: { connect: tagRecords.map((t) => ({ id: t.id })) },
        },
        include: { tags: { select: { name: true } } },
      });
    }

    response.status(existing ? 200 : 201).json({
      rating: {
        id: rating.id,
        score: rating.score,
        notes: rating.notes,
        tags: (rating.tags as TagName[]).map((t) => t.name),
        userId: rating.userId,
        restaurantId: rating.restaurantId,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      },
    });
  },
);

export { restaurantsRouter };

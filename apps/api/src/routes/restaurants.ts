import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

type RestaurantListRow = {
  id: string; name: string; address: string; city: string; cuisine: string;
  lat: number | null; lng: number | null; createdBy: string; createdAt: Date; sponsored: boolean;
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
    orderBy: [{ sponsored: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { ratings: true } }, ratings: { select: { score: true } } },
  });

  const data = (restaurants as unknown as RestaurantListRow[]).map((r) => {
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
      sponsored: r.sponsored,
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
      sponsored: (restaurant as unknown as { sponsored: boolean }).sponsored,
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

// GET /restaurants/:id/analytics — basic analytics snapshot
restaurantsRouter.get("/:id/analytics", async (request, response) => {
  const restaurantIdParam = Array.isArray(request.params.id)
    ? request.params.id[0]
    : request.params.id;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantIdParam },
    select: { id: true },
  });

  if (!restaurant) {
    response.status(404).json({ message: "Restaurant not found" });
    return;
  }

  const rows = await prisma.rating.findMany({
    where: { restaurantId: restaurantIdParam },
    select: {
      score: true,
      createdAt: true,
      tags: { select: { name: true } },
    },
  });

  const ratingCount = rows.length;
  const averageScore =
    ratingCount > 0
      ? Math.round((rows.reduce((sum, row) => sum + row.score, 0) / ratingCount) * 10) / 10
      : null;

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  let last7Days = 0;
  let last30Days = 0;
  const tagCounts = new Map<string, number>();

  for (const row of rows) {
    const created = row.createdAt.getTime();
    if (created >= thirtyDaysAgo) {
      last30Days += 1;
      if (created >= sevenDaysAgo) {
        last7Days += 1;
      }
    }

    for (const tag of row.tags) {
      tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
    }
  }

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  response.json({
    analytics: {
      ratingCount,
      averageScore,
      topTags,
      recentActivity: {
        last7Days,
        last30Days,
      },
    },
  });
});

// POST /restaurants/:id/ratings — add or update rating (auth required)
restaurantsRouter.post(
  "/:id/ratings",
  requireAuth,
  async (request: AuthenticatedRequest, response) => {
    const parsed = createRatingSchema.safeParse(request.body);
    const restaurantIdParam = Array.isArray(request.params.id)
      ? request.params.id[0]
      : request.params.id;

    if (!parsed.success) {
      response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantIdParam } });

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

// PATCH /restaurants/:id/sponsored — toggle sponsored status (auth required)
restaurantsRouter.patch("/:id/sponsored", requireAuth, async (request: AuthenticatedRequest, response) => {
  const restaurantIdParam = Array.isArray(request.params.id)
    ? request.params.id[0]
    : request.params.id;

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantIdParam } });

  if (!restaurant) {
    response.status(404).json({ message: "Restaurant not found" });
    return;
  }

  const currentSponsored = Boolean((restaurant as { sponsored?: boolean }).sponsored);

  const updated = await (prisma.restaurant as unknown as {
    update: (args: {
      where: { id: string };
      data: { sponsored: boolean };
    }) => Promise<{
      id: string;
      name: string;
      address: string;
      city: string;
      cuisine: string;
      lat: number | null;
      lng: number | null;
      createdBy: string;
      createdAt: Date;
      sponsored: boolean;
    }>;
  }).update({
    where: { id: restaurantIdParam },
    data: { sponsored: !currentSponsored },
  });

  response.json({
    restaurant: {
      id: updated.id,
      name: updated.name,
      address: updated.address,
      city: updated.city,
      cuisine: updated.cuisine,
      lat: updated.lat,
      lng: updated.lng,
      createdBy: updated.createdBy,
      createdAt: updated.createdAt,
      sponsored: (updated as unknown as { sponsored: boolean }).sponsored,
    },
  });
});

export { restaurantsRouter };


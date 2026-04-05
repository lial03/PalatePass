import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signAuthToken } from "../lib/jwt.js";

const now = new Date("2026-03-15T12:00:00.000Z");

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    restaurant: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    rating: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

import { restaurantsRouter } from "./restaurants.js";

const token = signAuthToken({ sub: "user_1", email: "user@test.com" });

function makeTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/restaurants", restaurantsRouter);
  return app;
}

const sampleRestaurant = {
  id: "rest_1",
  name: "Bella Cucina",
  address: "12 Olive St",
  city: "London",
  countryCode: "GB",
  countryName: "United Kingdom",
  cuisine: "Italian",
  googlePlaceId: null,
  submissionNotes: null,
  lat: 51.5,
  lng: -0.12,
  createdBy: "user_1",
  sponsored: false,
  createdAt: now,
  updatedAt: now,
};

describe("restaurants routes", () => {
  beforeEach(() => {
    mockPrisma.restaurant.count.mockReset();
    mockPrisma.restaurant.findMany.mockReset();
    mockPrisma.restaurant.findUnique.mockReset();
    mockPrisma.restaurant.create.mockReset();
    mockPrisma.restaurant.update.mockReset();
    mockPrisma.restaurant.delete.mockReset();
    mockPrisma.rating.findMany.mockReset();
    mockPrisma.rating.findUnique.mockReset();
    mockPrisma.rating.create.mockReset();
    mockPrisma.rating.update.mockReset();
    mockPrisma.rating.deleteMany.mockReset();
    mockPrisma.tag.upsert.mockReset();
  });

  // --- GET /restaurants ---

  it("lists restaurants", async () => {
    mockPrisma.restaurant.count.mockResolvedValueOnce(1);
    mockPrisma.restaurant.findMany.mockResolvedValueOnce([
      { ...sampleRestaurant, _count: { ratings: 2 }, ratings: [{ score: 4 }, { score: 5 }] },
    ]);

    const res = await request(makeTestApp()).get("/restaurants");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Bella Cucina");
    expect(res.body.data[0].averageScore).toBe(4.5);
    expect(res.body.total).toBe(1);
  });

  it("returns empty list when no restaurants", async () => {
    mockPrisma.restaurant.count.mockResolvedValueOnce(0);
    mockPrisma.restaurant.findMany.mockResolvedValueOnce([]);

    const res = await request(makeTestApp()).get("/restaurants");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it("applies query and country filters", async () => {
    mockPrisma.restaurant.count.mockResolvedValueOnce(0);
    mockPrisma.restaurant.findMany.mockResolvedValueOnce([]);

    const res = await request(makeTestApp())
      .get("/restaurants")
      .query({ query: "Bella", countryCode: "gb", limit: 5 });

    expect(res.status).toBe(200);
    expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          countryCode: { equals: "GB" },
          OR: expect.arrayContaining([
            { name: { contains: "Bella", mode: "insensitive" } },
          ]),
        }),
      }),
    );
  });

  // --- POST /restaurants ---

  it("creates a restaurant when authenticated", async () => {
    mockPrisma.restaurant.create.mockResolvedValueOnce(sampleRestaurant);

    const res = await request(makeTestApp())
      .post("/restaurants")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Bella Cucina",
        address: "12 Olive St",
        city: "London",
        countryCode: "GB",
        countryName: "United Kingdom",
        cuisine: "Italian",
        lat: 51.5,
        lng: -0.12,
      });

    expect(res.status).toBe(201);
    expect(res.body.restaurant.name).toBe("Bella Cucina");
  });

  it("returns 401 creating a restaurant without auth", async () => {
    const res = await request(makeTestApp())
      .post("/restaurants")
      .send({ name: "X", address: "Y", city: "Z", countryCode: "GB", countryName: "United Kingdom", cuisine: "Any" });

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid restaurant body", async () => {
    const res = await request(makeTestApp())
      .post("/restaurants")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "" }); // missing required fields + empty name

    expect(res.status).toBe(400);
  });

  // --- GET /restaurants/:id ---

  it("returns a restaurant with ratings", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce({
      ...sampleRestaurant,
      ratings: [
        {
          id: "rating_1",
          score: 5,
          notes: "Amazing!",
          photoUrls: [],
          budgetTier: null,
          budgetAmount: null,
          budgetCurrency: null,
          userId: "user_1",
          createdAt: now,
          user: { displayName: "Alice" },
          tags: [{ name: "romantic" }],
        },
      ],
    });

    const res = await request(makeTestApp()).get("/restaurants/rest_1");

    expect(res.status).toBe(200);
    expect(res.body.restaurant.name).toBe("Bella Cucina");
    expect(res.body.restaurant.averageScore).toBe(5);
    expect(res.body.ratings).toHaveLength(1);
    expect(res.body.ratings[0].tags).toEqual(["romantic"]);
  });

  it("returns 404 for unknown restaurant", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce(null);

    const res = await request(makeTestApp()).get("/restaurants/does-not-exist");

    expect(res.status).toBe(404);
  });

  // --- GET /restaurants/:id/analytics ---

  it("returns analytics snapshot for a restaurant", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce({ id: "rest_1" });
    mockPrisma.rating.findMany.mockResolvedValueOnce([
      {
        score: 5,
        createdAt: new Date("2026-03-14T12:00:00.000Z"),
        tags: [{ name: "cozy" }, { name: "date-night" }],
      },
      {
        score: 4,
        createdAt: new Date("2026-03-10T12:00:00.000Z"),
        tags: [{ name: "cozy" }],
      },
      {
        score: 3,
        createdAt: new Date("2026-02-20T12:00:00.000Z"),
        tags: [{ name: "affordable" }],
      },
    ]);

    const res = await request(makeTestApp()).get("/restaurants/rest_1/analytics");

    expect(res.status).toBe(200);
    expect(res.body.analytics.ratingCount).toBe(3);
    expect(res.body.analytics.averageScore).toBe(4);
    expect(res.body.analytics.topTags[0]).toEqual({ name: "cozy", count: 2 });
    expect(res.body.analytics.recentActivity.last7Days).toBeGreaterThanOrEqual(0);
    expect(res.body.analytics.recentActivity.last30Days).toBeGreaterThanOrEqual(0);
  });

  it("returns 404 analytics for unknown restaurant", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce(null);

    const res = await request(makeTestApp()).get("/restaurants/bad-id/analytics");

    expect(res.status).toBe(404);
  });

  // --- POST /restaurants/:id/ratings ---

  it("creates a rating for an existing restaurant", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce(sampleRestaurant);
    mockPrisma.tag.upsert.mockResolvedValueOnce({ id: "tag_1", name: "cozy" });
    mockPrisma.rating.findUnique.mockResolvedValueOnce(null);
    mockPrisma.rating.create.mockResolvedValueOnce({
      id: "rating_1",
      score: 4,
      notes: "Loved it",
      photoUrls: ["https://img.example.com/pasta.jpg"],
      budgetTier: "mid",
      budgetAmount: 35,
      budgetCurrency: "GBP",
      userId: "user_1",
      restaurantId: "rest_1",
      createdAt: now,
      updatedAt: now,
      tags: [{ name: "cozy" }],
    });

    const res = await request(makeTestApp())
      .post("/restaurants/rest_1/ratings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        score: 4,
        notes: "Loved it",
        tags: ["cozy"],
        photoUrls: ["https://img.example.com/pasta.jpg"],
        budgetTier: "mid",
        budgetAmount: 35,
        budgetCurrency: "GBP",
      });

    expect(res.status).toBe(201);
    expect(res.body.rating.score).toBe(4);
    expect(res.body.rating.tags).toEqual(["cozy"]);
  });

  it("updates an existing rating", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce(sampleRestaurant);
    mockPrisma.tag.upsert.mockResolvedValueOnce({ id: "tag_1", name: "cozy" });
    mockPrisma.rating.findUnique.mockResolvedValueOnce({
      id: "rating_1",
      userId: "user_1",
      restaurantId: "rest_1",
      tags: [],
    });
    mockPrisma.rating.update.mockResolvedValueOnce({
      id: "rating_1",
      score: 5,
      notes: "Even better!",
      photoUrls: [],
      budgetTier: null,
      budgetAmount: null,
      budgetCurrency: null,
      userId: "user_1",
      restaurantId: "rest_1",
      createdAt: now,
      updatedAt: now,
      tags: [{ name: "cozy" }],
    });

    const res = await request(makeTestApp())
      .post("/restaurants/rest_1/ratings")
      .set("Authorization", `Bearer ${token}`)
      .send({ score: 5, notes: "Even better!", tags: ["cozy"] });

    expect(res.status).toBe(200);
    expect(res.body.rating.score).toBe(5);
  });

  it("returns 404 rating an unknown restaurant", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce(null);

    const res = await request(makeTestApp())
      .post("/restaurants/bad-id/ratings")
      .set("Authorization", `Bearer ${token}`)
      .send({ score: 3 });

    expect(res.status).toBe(404);
  });

  it("returns 401 rating without auth", async () => {
    const res = await request(makeTestApp())
      .post("/restaurants/rest_1/ratings")
      .send({ score: 3 });

    expect(res.status).toBe(401);
  });

  // --- PATCH /restaurants/:id ---

  it("updates a restaurant when authenticated as creator", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce({ ...sampleRestaurant });
    mockPrisma.restaurant.update.mockResolvedValueOnce({ ...sampleRestaurant, name: "New Name" });

    const res = await request(makeTestApp())
      .patch("/restaurants/rest_1")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.restaurant.name).toBe("New Name");
  });

  it("returns 403 updating a restaurant as non-creator", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce({ ...sampleRestaurant, createdBy: "other_user" });

    const res = await request(makeTestApp())
      .patch("/restaurants/rest_1")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Hacker Cuisine" });

    expect(res.status).toBe(403);
  });

  it("returns 401 updating without auth", async () => {
    const res = await request(makeTestApp())
      .patch("/restaurants/rest_1")
      .send({ name: "Ghost Edit" });

    expect(res.status).toBe(401);
  });

  // --- DELETE /restaurants/:id ---

  it("deletes a restaurant when authenticated as creator", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce({ ...sampleRestaurant });
    mockPrisma.restaurant.delete.mockResolvedValueOnce(sampleRestaurant);

    const res = await request(makeTestApp())
      .delete("/restaurants/rest_1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("returns 403 deleting a restaurant as non-creator", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce({ ...sampleRestaurant, createdBy: "other_user" });

    const res = await request(makeTestApp())
      .delete("/restaurants/rest_1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  // --- DELETE /restaurants/:id/ratings ---

  it("retracts personal rating when authenticated", async () => {
    const res = await request(makeTestApp())
      .delete("/restaurants/rest_1/ratings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(mockPrisma.rating.deleteMany).toHaveBeenCalled();
  });

  it("returns 401 retracting rating without auth", async () => {
    const res = await request(makeTestApp())
      .delete("/restaurants/rest_1/ratings");

    expect(res.status).toBe(401);
  });
});

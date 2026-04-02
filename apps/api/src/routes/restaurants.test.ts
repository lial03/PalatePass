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
    },
    rating: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
  cuisine: "Italian",
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
    mockPrisma.rating.findUnique.mockReset();
    mockPrisma.rating.create.mockReset();
    mockPrisma.rating.update.mockReset();
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
      .send({ name: "X", address: "Y", city: "Z", cuisine: "Any" });

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

  // --- POST /restaurants/:id/ratings ---

  it("creates a rating for an existing restaurant", async () => {
    mockPrisma.restaurant.findUnique.mockResolvedValueOnce(sampleRestaurant);
    mockPrisma.tag.upsert.mockResolvedValueOnce({ id: "tag_1", name: "cozy" });
    mockPrisma.rating.findUnique.mockResolvedValueOnce(null);
    mockPrisma.rating.create.mockResolvedValueOnce({
      id: "rating_1",
      score: 4,
      notes: "Loved it",
      userId: "user_1",
      restaurantId: "rest_1",
      createdAt: now,
      updatedAt: now,
      tags: [{ name: "cozy" }],
    });

    const res = await request(makeTestApp())
      .post("/restaurants/rest_1/ratings")
      .set("Authorization", `Bearer ${token}`)
      .send({ score: 4, notes: "Loved it", tags: ["cozy"] });

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
    it("returns 401 rating without auth", async () => {
      const res = await request(makeTestApp())
        .post("/restaurants/rest_1/ratings")
        .send({ score: 3 });

      expect(res.status).toBe(401);
    });

    // --- PATCH /restaurants/:id/sponsored ---

    it("toggles sponsored status when authenticated", async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValueOnce({ ...sampleRestaurant, sponsored: false });
      mockPrisma.restaurant.update.mockResolvedValueOnce({ ...sampleRestaurant, sponsored: true });

      const res = await request(makeTestApp())
        .patch("/restaurants/rest_1/sponsored")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.restaurant.sponsored).toBe(true);
    });

    it("returns 404 toggling sponsored for unknown restaurant", async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValueOnce(null);

      const res = await request(makeTestApp())
        .patch("/restaurants/bad-id/sponsored")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("returns 401 toggling sponsored without auth", async () => {
      const res = await request(makeTestApp())
        .patch("/restaurants/rest_1/sponsored");

      expect(res.status).toBe(401);
    });
  });

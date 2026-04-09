import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signAuthToken } from "../lib/jwt.js";

const now = new Date("2026-03-15T14:00:00.000Z");

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    follow: {
      findMany: vi.fn(),
    },
    rating: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

import { recommendationsRouter } from "./recommendations.js";

function makeTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/recommendations", recommendationsRouter);
  return app;
}

const token = signAuthToken({ sub: "user_1", email: "user1@test.com" });

describe("recommendations routes", () => {
  beforeEach(() => {
    mockPrisma.follow.findMany.mockReset();
    mockPrisma.rating.findMany.mockReset();
  });

  it("returns 401 without auth", async () => {
    const res = await request(makeTestApp()).get("/recommendations/feed");

    expect(res.status).toBe(401);
  });

  it("returns empty feed when user follows nobody", async () => {
    mockPrisma.follow.findMany.mockResolvedValueOnce([]);
    mockPrisma.rating.findMany.mockResolvedValueOnce([]);

    const res = await request(makeTestApp())
      .get("/recommendations/feed")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.followingCount).toBe(0);
  });

  it("returns ranked recommendations from followed users", async () => {
    mockPrisma.follow.findMany.mockResolvedValueOnce([
      { followingId: "user_2" },
      { followingId: "user_3" },
    ]);

    mockPrisma.rating.findMany.mockResolvedValueOnce([
      {
        score: 5,
        notes: "Best pasta",
        createdAt: now,
        userId: "user_2",
        user: { id: "user_2", displayName: "Lia" },
        restaurant: {
          id: "rest_1",
          name: "Bella Cucina",
          address: "12 Olive St",
          city: "London",
          cuisine: "Italian",
          lat: 51.5,
          lng: -0.12,
        },
      },
      {
        score: 4,
        notes: "Great vibes",
        createdAt: now,
        userId: "user_3",
        user: { id: "user_3", displayName: "Sam" },
        restaurant: {
          id: "rest_1",
          name: "Bella Cucina",
          address: "12 Olive St",
          city: "London",
          cuisine: "Italian",
          lat: 51.5,
          lng: -0.12,
        },
      },
      {
        score: 4,
        notes: "Solid ramen",
        createdAt: now,
        userId: "user_2",
        user: { id: "user_2", displayName: "Lia" },
        restaurant: {
          id: "rest_2",
          name: "Ramen Hub",
          address: "6 Market Rd",
          city: "London",
          cuisine: "Japanese",
          lat: 51.52,
          lng: -0.1,
        },
      },
    ]);

    const res = await request(makeTestApp())
      .get("/recommendations/feed")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe("Bella Cucina");
    expect(res.body.data[0].endorsementCount).toBe(2);
    expect(res.body.data[0].networkAverageScore).toBe(4.5);
    expect(res.body.data[0].endorsedBy).toEqual(expect.arrayContaining(["Lia", "Sam"]));
    expect(res.body.meta.followingCount).toBe(2);
    expect(res.body.meta.candidateRatings).toBe(3);
  });

  it("respects feed limit", async () => {
    mockPrisma.follow.findMany.mockResolvedValueOnce([{ followingId: "user_2" }]);
    mockPrisma.rating.findMany.mockResolvedValueOnce([
      {
        score: 5,
        notes: null,
        createdAt: now,
        userId: "user_2",
        user: { id: "user_2", displayName: "Lia" },
        restaurant: {
          id: "rest_1",
          name: "Bella Cucina",
          address: "12 Olive St",
          city: "London",
          cuisine: "Italian",
          lat: 51.5,
          lng: -0.12,
        },
      },
      {
        score: 4,
        notes: null,
        createdAt: now,
        userId: "user_2",
        user: { id: "user_2", displayName: "Lia" },
        restaurant: {
          id: "rest_2",
          name: "Ramen Hub",
          address: "6 Market Rd",
          city: "London",
          cuisine: "Japanese",
          lat: 51.52,
          lng: -0.1,
        },
      },
    ]);

    const res = await request(makeTestApp())
      .get("/recommendations/feed?limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.limit).toBe(1);
  });
});

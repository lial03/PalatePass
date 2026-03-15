import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signAuthToken } from "../lib/jwt.js";

const now = new Date("2026-03-15T13:00:00.000Z");

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    rating: {
      findMany: vi.fn(),
    },
    follow: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

import { usersRouter } from "./users.js";

function makeTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/users", usersRouter);
  return app;
}

const token = signAuthToken({ sub: "user_1", email: "user1@test.com" });

describe("users routes", () => {
  beforeEach(() => {
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.update.mockReset();
    mockPrisma.rating.findMany.mockReset();
    mockPrisma.follow.upsert.mockReset();
    mockPrisma.follow.deleteMany.mockReset();
  });

  it("returns public profile summary", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user_2",
      displayName: "Lia",
      bio: "Food explorer",
      avatarUrl: "https://example.com/avatar.jpg",
      createdAt: now,
      _count: { followers: 4, following: 7, ratings: 3 },
      ratings: [
        { score: 5, restaurant: { cuisine: "Italian" } },
        { score: 4, restaurant: { cuisine: "Italian" } },
        { score: 3, restaurant: { cuisine: "Thai" } },
      ],
    });

    const res = await request(makeTestApp()).get("/users/user_2");

    expect(res.status).toBe(200);
    expect(res.body.profile.displayName).toBe("Lia");
    expect(res.body.profile.stats.averageRating).toBe(4);
    expect(res.body.profile.stats.favoriteCuisines).toEqual(["Italian", "Thai"]);
  });

  it("returns 404 when profile is missing", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(makeTestApp()).get("/users/unknown");

    expect(res.status).toBe(404);
  });

  it("updates current user profile", async () => {
    mockPrisma.user.update.mockResolvedValueOnce({
      id: "user_1",
      email: "user1@test.com",
      displayName: "Updated Name",
      bio: "Updated bio",
      avatarUrl: "https://example.com/new.jpg",
      updatedAt: now,
    });

    const res = await request(makeTestApp())
      .patch("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: "Updated Name",
        bio: "Updated bio",
        avatarUrl: "https://example.com/new.jpg",
      });

    expect(res.status).toBe(200);
    expect(res.body.user.displayName).toBe("Updated Name");
  });

  it("returns 400 for empty profile update", async () => {
    const res = await request(makeTestApp())
      .patch("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("At least one field is required");
  });

  it("follows another user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user_2" });
    mockPrisma.follow.upsert.mockResolvedValueOnce({ id: "follow_1" });

    const res = await request(makeTestApp())
      .post("/users/user_2/follow")
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Followed user");
  });

  it("returns 400 when trying to follow self", async () => {
    const res = await request(makeTestApp())
      .post("/users/user_1/follow")
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(res.status).toBe(400);
  });

  it("unfollows a user", async () => {
    mockPrisma.follow.deleteMany.mockResolvedValueOnce({ count: 1 });

    const res = await request(makeTestApp())
      .delete("/users/user_2/follow")
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(res.status).toBe(204);
  });

  describe("taste-match", () => {
    it("returns 401 without a token", async () => {
      const res = await request(makeTestApp()).get("/users/user_2/taste-match");
      expect(res.status).toBe(401);
    });

    it("returns 400 when matching with self", async () => {
      const res = await request(makeTestApp())
        .get("/users/user_1/taste-match")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown user", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      const res = await request(makeTestApp())
        .get("/users/unknown/taste-match")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("returns 0 when either user has no ratings", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user_2" });
      mockPrisma.rating.findMany
        .mockResolvedValueOnce([]) // my ratings
        .mockResolvedValueOnce([  // their ratings
          { restaurantId: "r1", score: 5, tags: [], restaurant: { cuisine: "Italian" } },
        ]);

      const res = await request(makeTestApp())
        .get("/users/user_2/taste-match")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(0);
    });

    it("returns 100 for identical rating profiles", async () => {
      const ratings = [
        { restaurantId: "r1", score: 5, tags: [{ name: "cozy" }], restaurant: { cuisine: "Italian" } },
        { restaurantId: "r2", score: 4, tags: [{ name: "affordable" }], restaurant: { cuisine: "Thai" } },
      ];
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user_2" });
      mockPrisma.rating.findMany
        .mockResolvedValueOnce(ratings)
        .mockResolvedValueOnce(ratings);

      const res = await request(makeTestApp())
        .get("/users/user_2/taste-match")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.score).toBe(100);
    });

    it("returns a partial score for partial overlap", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user_2" });
      mockPrisma.rating.findMany
        .mockResolvedValueOnce([
          { restaurantId: "r1", score: 5, tags: [{ name: "cozy" }], restaurant: { cuisine: "Italian" } },
          { restaurantId: "r2", score: 2, tags: [], restaurant: { cuisine: "Thai" } },
        ])
        .mockResolvedValueOnce([
          { restaurantId: "r1", score: 3, tags: [{ name: "cozy" }], restaurant: { cuisine: "Italian" } },
          { restaurantId: "r3", score: 5, tags: [], restaurant: { cuisine: "Mexican" } },
        ]);

      const res = await request(makeTestApp())
        .get("/users/user_2/taste-match")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.score).toBeGreaterThan(0);
      expect(res.body.score).toBeLessThan(100);
    });
  });
});

import bcrypt from "bcryptjs";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signAuthToken } from "../lib/jwt.js";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

import { authRouter } from "./auth.js";

function makeTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter);
  return app;
}

describe("auth routes", () => {
  beforeEach(() => {
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.create.mockReset();
  });

  it("registers a user", async () => {
    const now = new Date("2026-03-15T10:00:00.000Z");

    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockPrisma.user.create.mockResolvedValueOnce({
      id: "user_123",
      email: "testuser@palatepass.com",
      displayName: "Test User",
      createdAt: now,
    });

    const response = await request(makeTestApp())
      .post("/auth/register")
      .send({
        email: "testuser@palatepass.com",
        password: "StrongPass123!",
        displayName: "Test User",
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("testuser@palatepass.com");
    expect(response.body.user.displayName).toBe("Test User");
    expect(response.body.token).toEqual(expect.any(String));
  });

  it("blocks duplicate registration", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "existing" });

    const response = await request(makeTestApp())
      .post("/auth/register")
      .send({
        email: "testuser@palatepass.com",
        password: "StrongPass123!",
        displayName: "Test User",
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Email is already registered");
  });

  it("logs in with valid credentials", async () => {
    const now = new Date("2026-03-15T10:00:00.000Z");
    const passwordHash = await bcrypt.hash("StrongPass123!", 12);

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user_123",
      email: "testuser@palatepass.com",
      displayName: "Test User",
      passwordHash,
      createdAt: now,
    });

    const response = await request(makeTestApp())
      .post("/auth/login")
      .send({
        email: "testuser@palatepass.com",
        password: "StrongPass123!",
      });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe("user_123");
    expect(response.body.token).toEqual(expect.any(String));
  });

  it("returns 401 for invalid login", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const response = await request(makeTestApp())
      .post("/auth/login")
      .send({
        email: "missing@palatepass.com",
        password: "StrongPass123!",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("returns current user for valid bearer token", async () => {
    const now = new Date("2026-03-15T10:00:00.000Z");
    const token = signAuthToken({ sub: "user_123", email: "testuser@palatepass.com" });

    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "user_123",
      email: "testuser@palatepass.com",
      displayName: "Test User",
      createdAt: now,
      updatedAt: now,
    });

    const response = await request(makeTestApp())
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("testuser@palatepass.com");
  });

  it("returns 401 when token is missing", async () => {
    const response = await request(makeTestApp()).get("/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Missing or invalid authorization header");
  });
});

import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { signAuthToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import {
    requireAuth,
    type AuthenticatedRequest,
} from "../middleware/auth.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2).max(60),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const authRouter = Router();

authRouter.post("/register", async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  const { email, password, displayName } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existing) {
    response.status(409).json({ message: "Email is already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      displayName,
    },
  });

  const token = signAuthToken({ sub: user.id, email: user.email });

  response.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
  });
});

authRouter.post("/login", async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
    return;
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    response.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!isValidPassword) {
    response.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = signAuthToken({ sub: user.id, email: user.email });

  response.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
  });
});

authRouter.get("/me", requireAuth, async (request, response) => {
  const authRequest = request as AuthenticatedRequest;

  if (!authRequest.authUser) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: authRequest.authUser.id },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  response.json({ user });
});

export { authRouter };


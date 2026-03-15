import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/jwt.js";
import type { AuthUser } from "../types/auth.js";

export type AuthenticatedRequest = Request & {
  authUser?: AuthUser;
};

export function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
): void {
  const header = request.header("authorization");

  if (!header || !header.startsWith("Bearer ")) {
    response.status(401).json({ message: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7).trim();

  try {
    const payload = verifyAuthToken(token);
    request.authUser = { id: payload.sub, email: payload.email };
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired token" });
  }
}

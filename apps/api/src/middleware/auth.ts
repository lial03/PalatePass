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
  const cookies = (request as AuthenticatedRequest & { cookies?: Record<string, string> }).cookies;
  const cookieToken = cookies?.pp_token;
  const header = request.header("authorization");
  const token = cookieToken ?? (header?.startsWith("Bearer ") ? header.slice(7).trim() : null);

  if (!token) {
    response.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    request.authUser = { id: payload.sub, email: payload.email };
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired token" });
  }
}

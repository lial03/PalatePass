import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthTokenPayload } from "../types/auth.js";

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    subject: payload.sub,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign({ email: payload.email }, env.JWT_SECRET, options);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

  if (!decoded.sub || typeof decoded.sub !== "string") {
    throw new Error("Invalid token subject");
  }

  if (!decoded.email || typeof decoded.email !== "string") {
    throw new Error("Invalid token email");
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
  };
}

export function getTokenExpiresAt(token: string): number {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  return (decoded?.exp ?? 0) * 1000;
}

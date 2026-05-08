import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "@/lib/env";
import { TokenInvalido } from "./errors";

const EXPIRES_IN = "7d";

export interface AuthTokenPayload {
  userId: string;
  role: Role;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded !== "object" || !decoded) throw new TokenInvalido();
    const { userId, role } = decoded as Partial<AuthTokenPayload>;
    if (!userId || !role) throw new TokenInvalido();
    return { userId, role };
  } catch {
    throw new TokenInvalido();
  }
}

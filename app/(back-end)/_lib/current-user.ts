import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { readAuthCookie } from "./auth-cookie";
import { verifyAuthToken } from "./jwt";
import { NaoAutenticado } from "./errors";

export async function getUserFromRequest(req: NextRequest) {
  const token = readAuthCookie(req);
  if (!token) return null;
  try {
    const { userId } = verifyAuthToken(token);
    return await prisma.user.findUnique({
      where: { id: userId },
      include: { paciente: true, profissional: true, staff: true },
    });
  } catch {
    return null;
  }
}

export async function requireUserFromRequest(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) throw new NaoAutenticado();
  return user;
}

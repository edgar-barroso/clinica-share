import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  let dbStatus: "ok" | "error" = "ok";
  let dbError: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    message: "Hello from ClinicaShare API",
    db: dbStatus,
    ...(dbError && { dbError }),
    timestamp: new Date().toISOString(),
  });
}

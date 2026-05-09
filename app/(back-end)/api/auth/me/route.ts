import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/(back-end)/_lib/current-user";
import { serializeUser } from "@/app/(back-end)/_lib/serialize-user";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  return NextResponse.json({ user: serializeUser(user) });
}

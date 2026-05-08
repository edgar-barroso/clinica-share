import { NextRequest } from "next/server";

const BASE = "http://localhost:3000";

export function jsonRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getRequest(path: string): NextRequest {
  return new NextRequest(`${BASE}${path}`, { method: "GET" });
}

export function withAuthCookie(req: NextRequest, token: string): NextRequest {
  req.cookies.set("auth-token", token);
  return req;
}

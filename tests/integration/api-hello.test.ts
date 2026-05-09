import { describe, expect, it } from "vitest";
import { GET } from "@/app/(back-end)/api/hello/route";

describe("GET /api/hello", () => {
  it("retorna 200 com shape esperado", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.message).toBe("Hello from ClinicaShare API");
    expect(body.db).toMatch(/^(ok|error)$/);
    expect(typeof body.timestamp).toBe("string");
    expect(new Date(body.timestamp).toString()).not.toBe("Invalid Date");
  });
});

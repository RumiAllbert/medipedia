import { describe, expect, it } from "vitest";

import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("limits calls per key", () => {
    const key = `test:${Date.now()}`;
    expect(rateLimit({ key, max: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(rateLimit({ key, max: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(rateLimit({ key, max: 2, windowMs: 60_000 }).allowed).toBe(false);
  });
});

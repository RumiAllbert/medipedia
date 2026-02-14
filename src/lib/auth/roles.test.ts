import { Role } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { hasRole, normalizeRole } from "@/lib/auth/roles";

describe("role helpers", () => {
  it("supports hierarchy checks", () => {
    expect(hasRole(Role.ADMIN, Role.REVIEWER)).toBe(true);
    expect(hasRole(Role.REVIEWER, Role.CONTRIBUTOR)).toBe(true);
    expect(hasRole(Role.READER, Role.CONTRIBUTOR)).toBe(false);
  });

  it("normalizes role values", () => {
    expect(normalizeRole("admin")).toBe(Role.ADMIN);
    expect(normalizeRole("reviewer")).toBe(Role.REVIEWER);
    expect(normalizeRole("unknown")).toBeUndefined();
  });
});

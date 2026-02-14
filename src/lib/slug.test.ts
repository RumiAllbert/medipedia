import { describe, expect, it } from "vitest";

import { toSlug } from "@/lib/slug";

describe("toSlug", () => {
  it("converts title to lowercase slug", () => {
    expect(toSlug("Hypertension Overview")).toBe("hypertension-overview");
  });

  it("strips special characters", () => {
    expect(toSlug("What is COVID-19?")).toBe("what-is-covid-19");
  });

  it("trims whitespace", () => {
    expect(toSlug("  Test Title  ")).toBe("test-title");
  });

  it("handles multiple spaces", () => {
    expect(toSlug("Heart   Disease")).toBe("heart-disease");
  });

  it("handles empty string", () => {
    expect(toSlug("")).toBe("");
  });
});

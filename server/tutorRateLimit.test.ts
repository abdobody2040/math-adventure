import { beforeEach, describe, expect, it } from "vitest";
import { consumeTutorHintAllowance, resetTutorHintAllowanceForTests } from "./tutorRateLimit";

describe("tutor hint rate limit", () => {
  beforeEach(resetTutorHintAllowanceForTests);

  it("allows a short burst but blocks the next request until the one-minute window advances", () => {
    for (let index = 0; index < 6; index += 1) expect(consumeTutorHintAllowance("parent-7:child-1", 10_000 + index)).toMatchObject({ allowed: true });
    expect(consumeTutorHintAllowance("parent-7:child-1", 10_010)).toMatchObject({ allowed: false, retryAfterSeconds: 60 });
    expect(consumeTutorHintAllowance("parent-7:child-1", 70_001)).toMatchObject({ allowed: true });
  });
});

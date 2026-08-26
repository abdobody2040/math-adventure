import { describe, expect, it } from "vitest";
import { sanitizeTutorHint } from "./tutor";

describe("child-safe tutor hint guardrails", () => {
  const fallback = "Try one small step at a time.";

  it("keeps a short strategy hint but caps it at forty-five words", () => {
    expect(sanitizeTutorHint("Count the objects slowly, group them in twos, then check your total.", fallback)).toBe("Count the objects slowly, group them in twos, then check your total.");
    expect(sanitizeTutorHint(Array.from({ length: 50 }, (_, index) => `word${index}`).join(" "), fallback).split(" ")).toHaveLength(45);
  });

  it("replaces answer reveals, adult content, and personal-data prompts with the safe fallback", () => {
    expect(sanitizeTutorHint("The final answer is 12.", fallback)).toBe(fallback);
    expect(sanitizeTutorHint("Tell me your name and address first.", fallback)).toBe(fallback);
    expect(sanitizeTutorHint("Let us discuss an adult topic.", fallback)).toBe(fallback);
    expect(sanitizeTutorHint(null, fallback)).toBe(fallback);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("adventure accessibility styles", () => {
  it("respects reduced-motion preferences for decorative motion and transitions", () => {
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\*, \*::before, \*::after \{/);
    expect(styles).toContain("animation-duration: 0.01ms !important;");
    expect(styles).toContain("transition-duration: 0.01ms !important;");
    expect(styles).toContain("scroll-behavior: auto !important;");
  });

  it("keeps the onboarding hero in normal flow on narrow phones", () => {
    expect(styles).toContain(".onboarding-intro {\n    min-height: 0;");
    expect(styles).toContain(".onboarding-art {\n    inset: auto;");
  });
});

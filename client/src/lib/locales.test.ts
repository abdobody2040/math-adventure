import { describe, expect, it } from "vitest";
import { formatNumber, translate } from "./locales";

describe("localization", () => {
  it("interpolates localized values in English and Arabic", () => {
    expect(translate("en", "dashboard.progress", { progress: 2, target: 5 })).toBe("2 of 5");
    expect(translate("ar", "dashboard.progress", { progress: 2, target: 5 })).toBe("2 من 5");
  });

  it("formats Arabic numerals using the Arabic locale", () => {
    expect(formatNumber("ar", 1234)).toBe("١٬٢٣٤");
  });

  it("returns an unknown key transparently instead of introducing empty UI copy", () => {
    expect(translate("en", "missing.copy")).toBe("missing.copy");
  });
});

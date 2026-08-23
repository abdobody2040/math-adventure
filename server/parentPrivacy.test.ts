import { describe, expect, it } from "vitest";
import { assertChildDataExportAllowed } from "./parentPrivacy";

describe("parent export privacy", () => {
  it("rejects an export when the parent has disabled data export", () => {
    try {
      assertChildDataExportAllowed(false);
      throw new Error("Expected export permission to be denied");
    } catch (error) {
      expect(error).toMatchObject({ code: "FORBIDDEN", message: "parent.exportDisabled" });
    }
  });

  it("allows an export when the parent has explicitly allowed it", () => {
    expect(() => assertChildDataExportAllowed(true)).not.toThrow();
  });
});

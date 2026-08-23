import { describe, expect, it } from "vitest";
import { resolveParentEntryState } from "./entryFlow";

describe("parent entry flow", () => {
  it("keeps learning procedures out of reach while a signed-in parent has no child profiles", () => {
    expect(resolveParentEntryState({ authLoading: false, authenticated: true, childrenLoading: false, hasChildrenError: false, childCount: 0 })).toBe("onboarding");
  });

  it("uses a recoverable state instead of redirecting when child data cannot load", () => {
    expect(resolveParentEntryState({ authLoading: false, authenticated: true, childrenLoading: false, hasChildrenError: true, childCount: 0 })).toBe("error");
  });

  it("routes unauthenticated visitors to the public landing experience", () => {
    expect(resolveParentEntryState({ authLoading: false, authenticated: false, childrenLoading: false, hasChildrenError: false, childCount: 0 })).toBe("landing");
  });
});

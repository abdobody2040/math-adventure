export type ParentEntryState = "loading" | "landing" | "error" | "onboarding" | "ready";

export function resolveParentEntryState(input: {
  authLoading: boolean;
  authenticated: boolean;
  childrenLoading: boolean;
  hasChildrenError: boolean;
  childCount: number;
}): ParentEntryState {
  if (input.authLoading || (input.authenticated && input.childrenLoading)) return "loading";
  if (!input.authenticated) return "landing";
  if (input.hasChildrenError) return "error";
  if (input.childCount === 0) return "onboarding";
  return "ready";
}

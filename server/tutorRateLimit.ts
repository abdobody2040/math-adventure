const WINDOW_MS = 60_000;
const MAX_HINTS_PER_WINDOW = 6;
const attemptsByKey = new Map<string, number[]>();

export function consumeTutorHintAllowance(key: string, now = Date.now()) {
  const recent = (attemptsByKey.get(key) ?? []).filter(timestamp => timestamp > now - WINDOW_MS);
  if (recent.length >= MAX_HINTS_PER_WINDOW) {
    attemptsByKey.set(key, recent);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0]! + WINDOW_MS - now) / 1000)) };
  }
  recent.push(now);
  attemptsByKey.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetTutorHintAllowanceForTests() {
  attemptsByKey.clear();
}

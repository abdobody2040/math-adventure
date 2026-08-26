import { beforeEach, describe, expect, it } from "vitest";
import { enqueueAnswer, readQueuedAnswers, removeQueuedAnswers, summarizeOfflineSync } from "./offlineQueue";

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(globalThis, "localStorage", { value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) }, configurable: true });
});

describe("offline answer queue", () => {
  it("deduplicates queued answer operations and removes only confirmed keys", () => {
    const childId = "child-1";
    const first = { idempotencyKey: "00000000-0000-0000-0000-000000000001", questionSessionId: "00000000-0000-0000-0000-000000000010", answer: "4", responseTimeMs: 1500, usedHint: false };
    const second = { ...first, idempotencyKey: "00000000-0000-0000-0000-000000000002", answer: "5" };
    enqueueAnswer(childId, first); enqueueAnswer(childId, first); enqueueAnswer(childId, second);
    expect(readQueuedAnswers(childId)).toHaveLength(2);
    removeQueuedAnswers(childId, [first.idempotencyKey]);
    expect(readQueuedAnswers(childId)).toEqual([second]);
  });

  it("summarizes accepted, duplicate, and rejected reconnect operations", () => {
    expect(summarizeOfflineSync([
      { idempotencyKey: "a", status: "processed" },
      { idempotencyKey: "b", status: "duplicate" },
      { idempotencyKey: "c", status: "rejected" },
    ])).toEqual({ processed: 1, duplicates: 1, rejected: 1 });
  });
});

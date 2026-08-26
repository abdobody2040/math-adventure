export type QueuedAnswer = {
  idempotencyKey: string;
  questionSessionId: string;
  answer: string;
  responseTimeMs: number;
  usedHint: boolean;
};

const keyFor = (childId: string) => `math-adventure:offline-answers:${childId}`;

export function readQueuedAnswers(childId: string): QueuedAnswer[] {
  try { return JSON.parse(localStorage.getItem(keyFor(childId)) ?? "[]") as QueuedAnswer[]; } catch { return []; }
}

export function enqueueAnswer(childId: string, answer: QueuedAnswer) {
  const existing = readQueuedAnswers(childId);
  if (existing.some(item => item.idempotencyKey === answer.idempotencyKey)) return;
  localStorage.setItem(keyFor(childId), JSON.stringify([...existing, answer].slice(-20)));
}

export function removeQueuedAnswers(childId: string, keys: string[]) {
  const keySet = new Set(keys);
  localStorage.setItem(keyFor(childId), JSON.stringify(readQueuedAnswers(childId).filter(item => !keySet.has(item.idempotencyKey))));
}

export type OfflineSyncResult = { idempotencyKey: string; status: "processed" | "duplicate" | "rejected" };

export function summarizeOfflineSync(results: OfflineSyncResult[]) {
  return results.reduce((summary, item) => ({
    processed: summary.processed + (item.status === "processed" ? 1 : 0),
    duplicates: summary.duplicates + (item.status === "duplicate" ? 1 : 0),
    rejected: summary.rejected + (item.status === "rejected" ? 1 : 0),
  }), { processed: 0, duplicates: 0, rejected: 0 });
}

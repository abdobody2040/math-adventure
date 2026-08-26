export type OfflineOperationStatus = "processed" | "duplicate" | "rejected";

export async function processQueuedAnswer(existing: { processedAt: Date | null } | undefined, persistAnswer: () => Promise<void>): Promise<OfflineOperationStatus> {
  if (existing?.processedAt) return "duplicate";
  try {
    await persistAnswer();
    return "processed";
  } catch {
    return "rejected";
  }
}

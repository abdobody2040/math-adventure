import { describe, expect, it, vi } from "vitest";
import { processQueuedAnswer } from "./offlineSync";

describe("offline answer processing", () => {
  it("does not execute an already processed operation or issue its reward twice", async () => {
    const persistAnswer = vi.fn().mockResolvedValue(undefined);
    await expect(processQueuedAnswer({ processedAt: new Date() }, persistAnswer)).resolves.toBe("duplicate");
    expect(persistAnswer).not.toHaveBeenCalled();
  });

  it("reports processed and rejected operations without throwing the whole sync batch", async () => {
    await expect(processQueuedAnswer(undefined, vi.fn().mockResolvedValue(undefined))).resolves.toBe("processed");
    await expect(processQueuedAnswer(undefined, vi.fn().mockRejectedValue(new Error("expired session")))).resolves.toBe("rejected");
  });
});

import { describe, expect, it } from "vitest";
import { serializeMatchingAnswer, serializeOrderingAnswer, serializeVisualSelectionAnswer } from "./interactionAnswers";

describe("lesson interaction answer serialization", () => {
  it("serializes ordering choices in learner-selected order", () => {
    expect(serializeOrderingAnswer(["12", "16", "20"])).toBe("12,16,20");
  });

  it("serializes complete matching answers in authored source order", () => {
    expect(serializeMatchingAnswer(
      [{ source: "1/2" }, { source: "1/4" }],
      { "1/4": "quarter", "1/2": "half" },
    )).toBe("1/2:half|1/4:quarter");
  });

  it("withholds incomplete or duplicate matching answers", () => {
    const pairs = [{ source: "A" }, { source: "B" }];
    expect(serializeMatchingAnswer(pairs, { A: "one" })).toBeNull();
    expect(serializeMatchingAnswer(pairs, { A: "one", B: "one" })).toBeNull();
  });

  it("submits the visual option key rather than its label", () => {
    expect(serializeVisualSelectionAnswer("stars-6")).toBe("stars-6");
  });
});

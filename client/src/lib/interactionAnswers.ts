export type MatchingPair = { source: string };

/** Serializes a learner's ordered choices in the canonical server format. */
export function serializeOrderingAnswer(values: readonly string[]) {
  return values.join(",");
}

/**
 * Serializes pairs in prompt order so a correct matching answer remains stable
 * even when the learner selects the sources in a different order.
 */
export function serializeMatchingAnswer(pairs: readonly MatchingPair[], matches: Readonly<Record<string, string>>) {
  if (!pairs.length || pairs.some(pair => !matches[pair.source])) return null;
  const targets = pairs.map(pair => matches[pair.source]);
  if (new Set(targets).size !== targets.length) return null;
  return pairs.map(pair => `${pair.source}:${matches[pair.source]}`).join("|");
}

/** Visual selections submit their authored option key, never display text. */
export function serializeVisualSelectionAnswer(optionKey: string) {
  return optionKey;
}

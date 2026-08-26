export type AdaptiveAction = "practice" | "advance" | "review" | "remediate";
export type AdaptiveSkill = { key: string; worldKey: string; order: number };

/**
 * Resolves the next owned curriculum target on the server. Advancement moves
 * forward in the current unlocked world; remediation stays on the weak skill.
 */
export function selectAdaptiveSkill(input: { action: AdaptiveAction; answeredSkillKey: string; availableSkills: readonly AdaptiveSkill[] }) {
  const answered = input.availableSkills.find(skill => skill.key === input.answeredSkillKey);
  if (!answered || input.action !== "advance") return input.answeredSkillKey;
  return input.availableSkills
    .filter(skill => skill.worldKey === answered.worldKey && skill.order > answered.order)
    .sort((left, right) => left.order - right.order)[0]?.key ?? answered.key;
}

export function recentPerformanceMetrics(attempts: readonly { isCorrect: boolean; responseTimeMs: number }[]) {
  if (!attempts.length) return { correctRate: undefined, averageResponseTimeMs: undefined };
  return {
    correctRate: attempts.filter(attempt => attempt.isCorrect).length / attempts.length,
    averageResponseTimeMs: Math.round(attempts.reduce((sum, attempt) => sum + attempt.responseTimeMs, 0) / attempts.length),
  };
}

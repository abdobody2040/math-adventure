import type { AdaptiveAction } from "./adaptiveSelection";

type Skill = { key: string };
type Recommendation = { skillKey: string; action: AdaptiveAction; difficulty: number } | undefined;

export function resolveAdaptiveQuestionTarget(input: { unlockedSkills: readonly Skill[]; masteryBySkill: ReadonlyMap<string, number>; requestedSkillKey?: string; recommendation?: Recommendation }) {
  const requested = input.requestedSkillKey ? input.unlockedSkills.find(skill => skill.key === input.requestedSkillKey) : undefined;
  const recommended = input.recommendation ? input.unlockedSkills.find(skill => skill.key === input.recommendation?.skillKey) : undefined;
  const mustFollowAdaptivePath = input.recommendation?.action === "remediate" || input.recommendation?.action === "advance";
  const skill = (mustFollowAdaptivePath ? recommended : requested ?? recommended) ?? [...input.unlockedSkills].sort((left, right) => (input.masteryBySkill.get(left.key) ?? 0) - (input.masteryBySkill.get(right.key) ?? 0))[0];
  if (!skill) throw new Error("learning.error.noUnlockedSkills");
  const difficulty = input.recommendation?.skillKey === skill.key
    ? input.recommendation.difficulty
    : Math.max(1, Math.min(5, Math.ceil((input.masteryBySkill.get(skill.key) ?? 0) / 25)) || 1);
  return { skillKey: skill.key, difficulty, action: input.recommendation?.action ?? "practice" as AdaptiveAction };
}

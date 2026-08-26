import { InteractionKind, skillByKey, starterBossQuestionTemplates, starterQuestionTemplates } from "../shared/learningContent";

export type QuestionPresentation = {
  kind: string;
  interaction: InteractionKind;
  promptKey: string;
  choices?: string[];
  left?: number;
  right?: number;
  amount?: number;
  values?: (number | null)[];
  visual?: { numerator?: number; denominator?: number; shape?: string; groups?: number; each?: number };
  matchSource?: string;
  matchingPairs?: { source: string; target: string }[];
  matchTargets?: string[];
  visualOptions?: { key: string; value: number; label: string }[];
  timeLimitSeconds?: number;
  bossTemplateKey?: string;
  bossChallengeKey?: string;
  bossOperator?: "+" | "−" | "×" | "÷";
  activity?: "guidedPractice" | "skillPractice" | "review" | "challenge";
};

export type GeneratedQuestion = { presentation: QuestionPresentation; correctAnswer: string; explanationKey: string };
export type AdaptiveDecision = { action: "practice" | "advance" | "review" | "remediate"; difficulty: number; reasonKey: string; priority: number };
export type AdaptiveActivity = QuestionPresentation["activity"];
const activityByAdaptiveAction: Record<AdaptiveDecision["action"], NonNullable<AdaptiveActivity>> = { remediate: "guidedPractice", practice: "skillPractice", review: "review", advance: "challenge" };

export function activityForAdaptiveAction(action: AdaptiveDecision["action"]): NonNullable<AdaptiveActivity> {
  return activityByAdaptiveAction[action];
}

function seededRandom(seed: string) {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) { value ^= seed.charCodeAt(index); value = Math.imul(value, 16777619); }
  return () => { value += 0x6d2b79f5; let result = value; result = Math.imul(result ^ (result >>> 15), result | 1); result ^= result + Math.imul(result ^ (result >>> 7), result | 61); return ((result ^ (result >>> 14)) >>> 0) / 4294967296; };
}
const randomInt = (min: number, max: number, random: () => number) => Math.floor(random() * (max - min + 1)) + min;
const shuffle = <T,>(items: T[], random: () => number) => [...items].sort(() => random() - 0.5);
const numericChoices = (answer: number, max: number, random: () => number) => {
  const choices = new Set<number>([answer]);
  while (choices.size < 4) choices.add(Math.max(0, Math.min(max, answer + (randomInt(-5, 5, random) || 1))));
  return shuffle(Array.from(choices), random).map(String);
};
const interactionChoices = (interaction: InteractionKind, answer: number, max: number, random: () => number) => (["numeric", "timed"].includes(interaction) ? undefined : numericChoices(answer, max, random));
const toVisualOptions = (choices: string[] | undefined) => choices?.map(choice => ({ key: choice, value: Math.max(1, Number(choice.split("/")[0]) || Number(choice) || 1), label: choice }));
const interactionForActivity = (baseInteraction: InteractionKind, generatorKey: string, activity?: AdaptiveActivity): InteractionKind => {
  if (activity === "guidedPractice") return ["count", "fraction", "geometry"].includes(generatorKey) ? "visual" : "choice";
  if (activity === "challenge" && ["choice", "numeric"].includes(baseInteraction)) return "timed";
  return baseInteraction;
};

export function generateQuestion(skillKey: string, difficulty: number, seed: string, activity?: AdaptiveActivity): GeneratedQuestion {
  const skill = skillByKey[skillKey];
  if (!skill) throw new Error("learning.error.unknownSkill");
  const template = starterQuestionTemplates.find(item => item.skillKey === skillKey && item.difficulty <= difficulty);
  if (!template) throw new Error("learning.error.templateUnavailable");
  const random = seededRandom(`${seed}:${template.key}:${difficulty}`);
  const interaction = interactionForActivity(template.interaction, skill.generatorKey, activity);
  const max = difficulty >= 4 ? 100 : difficulty >= 2 ? 20 : 10;
  const timed = interaction === "timed" ? { timeLimitSeconds: difficulty >= 3 ? 25 : 40 } : {};
  const make = (kind: string, answer: number, explanationKey: string, left?: number, right?: number, visual?: QuestionPresentation["visual"]): GeneratedQuestion => {
    const choices = interactionChoices(interaction, answer, Math.max(max, answer + 5), random);
    return { presentation: { kind, interaction, promptKey: `questions.${kind}`, left, right, visual, choices, visualOptions: interaction === "visual" ? toVisualOptions(choices) : undefined, ...timed }, correctAnswer: String(answer), explanationKey };
  };
  if (skill.generatorKey === "count") { const amount = randomInt(1, max, random); const choices = interactionChoices(interaction, amount, max, random); return { presentation: { kind: "count", interaction, promptKey: "questions.count", amount, choices, visual: { groups: amount }, visualOptions: interaction === "visual" ? (choices ?? []).map(choice => ({ key: choice, value: Number(choice), label: choice })) : undefined, ...timed }, correctAnswer: String(amount), explanationKey: "feedback.countExplanation" }; }
  if (skill.generatorKey === "compare") { const left = randomInt(1, max, random); let right = randomInt(1, max, random); if (right === left) right = Math.min(max, right + 1); const answer = left > right ? ">" : "<"; return { presentation: { kind: "compare", interaction: "choice", promptKey: "questions.compare", left, right, choices: ["<", ">", "="], ...timed }, correctAnswer: answer, explanationKey: "feedback.compareExplanation" }; }
  if (skill.generatorKey === "sequence") { const step = skillKey === "logic-sequences" ? 2 : 1; const start = randomInt(1, max - step * 4, random); const sequence = [start, start + step, start + step * 2, start + step * 3]; if (interaction === "ordering") return { presentation: { kind: "sequence", interaction, promptKey: "questions.sequence", values: sequence, choices: shuffle(sequence.map(String), random), ...timed }, correctAnswer: sequence.join(","), explanationKey: "feedback.sequenceExplanation" }; const answer = sequence[2]; return { presentation: { kind: "sequence", interaction, promptKey: "questions.sequence", values: [start, start + step, null, start + step * 3], choices: interaction === "numeric" ? undefined : numericChoices(answer, max, random), ...timed }, correctAnswer: String(answer), explanationKey: "feedback.sequenceExplanation" }; }
  if (skill.generatorKey === "addition") { const arithmeticMax = skillKey === "add-within-100" ? 100 : skillKey === "add-within-20" ? 20 : 10; const left = randomInt(1, Math.floor(arithmeticMax / 2), random); const right = randomInt(1, arithmeticMax - left, random); return make("addition", left + right, "feedback.additionExplanation", left, right); }
  if (skill.generatorKey === "subtraction") { const arithmeticMax = skillKey.includes("100") ? 100 : skillKey.includes("20") ? 20 : 10; const left = randomInt(2, arithmeticMax, random); const right = randomInt(1, left - 1, random); return make("subtraction", left - right, "feedback.subtractionExplanation", left, right); }
  if (skill.generatorKey === "multiplication") { const left = randomInt(2, difficulty >= 3 ? 12 : 6, random); const right = randomInt(2, difficulty >= 3 ? 12 : 6, random); return make("multiplication", left * right, "feedback.multiplicationExplanation", left, right, { groups: left, each: right }); }
  if (skill.generatorKey === "division") { const divisor = randomInt(2, 8, random); const answer = randomInt(2, difficulty >= 3 ? 12 : 6, random); const dividend = divisor * answer; return make("division", answer, "feedback.divisionExplanation", dividend, divisor, { groups: divisor, each: answer }); }
  if (skill.generatorKey === "fraction") { const denominator = [2, 3, 4, 5][randomInt(0, 3, random)]; const numerator = randomInt(1, denominator - 1, random); if (interaction === "matching") { const matchingPairs = [{ source: "1/2", target: "2/4" }, { source: "1/3", target: "2/6" }]; const answer = matchingPairs.map(pair => `${pair.source}:${pair.target}`).join("|"); return { presentation: { kind: "fraction", interaction, promptKey: "questions.matching", matchSource: matchingPairs[0].source, matchingPairs, matchTargets: shuffle(matchingPairs.map(pair => pair.target), random), visual: { numerator: 1, denominator: 2 }, ...timed }, correctAnswer: answer, explanationKey: "feedback.fractionExplanation" }; } const answer = `${numerator}/${denominator}`; const choices = shuffle([answer, `1/${denominator}`, `${Math.min(denominator - 1, numerator + 1)}/${denominator}`, `${numerator}/${denominator + 1}`], random); return { presentation: { kind: "fraction", interaction, promptKey: "questions.fraction", choices: interaction === "numeric" ? undefined : choices, visualOptions: interaction === "visual" ? toVisualOptions(choices) : undefined, visual: { numerator, denominator }, ...timed }, correctAnswer: answer, explanationKey: "feedback.fractionExplanation" }; }
  if (skill.generatorKey === "geometry") { const isArea = skillKey === "area"; const left = randomInt(2, 10, random); const right = randomInt(2, 10, random); const answer = isArea ? left * right : skillKey === "perimeter" ? 2 * (left + right) : left; return make(isArea ? "area" : skillKey === "perimeter" ? "perimeter" : "geometry", answer, "feedback.geometryExplanation", left, right, { shape: skillKey === "shapes" ? "triangle" : "rectangle" }); }
  if (skill.generatorKey === "logic") { const isTrue = random() > .35; const statement = isTrue ? 1 : 0; return { presentation: { kind: "logic", interaction: "trueFalse", promptKey: "questions.logic", choices: ["true", "false"], visual: { shape: statement ? "pattern" : "broken-pattern" } }, correctAnswer: isTrue ? "true" : "false", explanationKey: "feedback.logicExplanation" }; }
  const first = randomInt(2, 10, random); const second = randomInt(2, 10, random); const isSubtraction = skillKey.includes("subtraction"); const isMultiplication = skillKey.includes("multiplication"); const answer = isSubtraction ? first : isMultiplication ? first * second : first + second;
  return make("wordProblem", answer, "feedback.wordProblemExplanation", first, second);
}

export function generateBossQuestion(worldKey: string, difficulty: number, seed: string): GeneratedQuestion & { skillKey: string } {
  const templates = starterBossQuestionTemplates.filter(template => template.worldKey === worldKey);
  if (!templates.length) throw new Error("learning.error.unknownWorld");
  const random = seededRandom(`${seed}:${worldKey}:boss`);
  const template = templates[randomInt(0, templates.length - 1, random)]!;
  const scaledDifficulty = Math.min(5, Math.max(2, difficulty));
  const max = scaledDifficulty >= 4 ? 50 : 20;
  const boss = (presentation: Omit<QuestionPresentation, "interaction" | "promptKey">, correctAnswer: string, explanationKey: string) => ({
    skillKey: template.skillKey,
    correctAnswer,
    explanationKey,
    presentation: { ...presentation, interaction: "boss" as InteractionKind, promptKey: "questions.boss", bossTemplateKey: template.key, bossChallengeKey: template.challengeKey, bossOperator: template.operator },
  });
  if (template.kind === "count") {
    const amount = randomInt(4, max, random);
    return boss({ kind: "count", amount, choices: numericChoices(amount, max, random) }, String(amount), "feedback.countExplanation");
  }
  if (template.kind === "compare") {
    const left = randomInt(2, max, random); let right = randomInt(1, max, random); if (left === right) right = Math.max(1, right - 1);
    return boss({ kind: "compare", left, right, choices: ["<", ">", "="] }, left > right ? ">" : "<", "feedback.compareExplanation");
  }
  if (template.kind === "addition" || template.kind === "subtraction") {
    const left = randomInt(template.kind === "subtraction" ? 6 : 2, max, random);
    const right = randomInt(1, Math.max(1, template.kind === "subtraction" ? left - 1 : max - left), random);
    const answer = template.kind === "subtraction" ? left - right : left + right;
    return boss({ kind: template.kind, left, right, choices: template.interaction === "numeric" ? undefined : numericChoices(answer, max + 10, random) }, String(answer), template.kind === "addition" ? "feedback.additionExplanation" : "feedback.subtractionExplanation");
  }
  if (template.kind === "multiplication" || template.kind === "division") {
    const factor = randomInt(2, scaledDifficulty >= 4 ? 10 : 6, random); const other = randomInt(2, scaledDifficulty >= 4 ? 10 : 6, random);
    const left = template.kind === "division" ? factor * other : factor; const right = template.kind === "division" ? factor : other; const answer = template.kind === "division" ? other : factor * other;
    return boss({ kind: template.kind, left, right, choices: template.interaction === "numeric" ? undefined : numericChoices(answer, Math.max(30, answer + 8), random), visual: { groups: factor, each: other } }, String(answer), template.kind === "division" ? "feedback.divisionExplanation" : "feedback.multiplicationExplanation");
  }
  if (template.kind === "fraction") {
    const denominator = template.challengeKey === "compareFraction" ? 4 : [2, 3, 4][randomInt(0, 2, random)]; const numerator = randomInt(1, denominator - 1, random); const answer = `${numerator}/${denominator}`;
    const choices = shuffle([answer, `1/${denominator}`, `${Math.min(denominator - 1, numerator + 1)}/${denominator}`, `${numerator}/${denominator + 1}`], random);
    return boss({ kind: "fraction", choices, visual: { numerator, denominator } }, answer, "feedback.fractionExplanation");
  }
  if (template.kind === "geometry") {
    const left = randomInt(2, 9, random); const right = randomInt(2, 9, random); const answer = template.challengeKey === "perimeter" ? 2 * (left + right) : left * right;
    return boss({ kind: template.challengeKey === "perimeter" ? "perimeter" : "area", left, right, choices: template.interaction === "numeric" ? undefined : numericChoices(answer, 40, random), visual: { shape: "rectangle" } }, String(answer), "feedback.geometryExplanation");
  }
  const isTrue = random() > .35;
  return boss({ kind: "logic", choices: ["true", "false"], visual: { shape: isTrue ? "pattern" : "broken-pattern" } }, isTrue ? "true" : "false", "feedback.logicExplanation");
}

export function recommendAdaptiveNext(input: { attempts: number; correctAnswers: number; mastery: number; responseTimeMs: number; usedHint: boolean; recentCorrectRate?: number; recentAverageResponseTimeMs?: number }): AdaptiveDecision {
  const accuracy = input.attempts ? input.correctAnswers / input.attempts : 0;
  const recent = input.recentCorrectRate ?? accuracy;
  const pace = input.recentAverageResponseTimeMs ?? input.responseTimeMs;
  if (input.usedHint || accuracy < .5 || recent < .45) return { action: "remediate", difficulty: 1, reasonKey: "recommendations.remediate", priority: 4 };
  if (accuracy < .7 || input.mastery < 55) return { action: "practice", difficulty: Math.max(1, input.mastery >= 35 ? 2 : 1), reasonKey: "recommendations.practiceSkill", priority: 3 };
  if (accuracy >= .9 && recent >= .85 && pace <= 9000 && input.mastery >= 80) return { action: "advance", difficulty: Math.min(5, 2 + Math.floor(input.mastery / 25)), reasonKey: "recommendations.advance", priority: 2 };
  return { action: "review", difficulty: Math.min(4, Math.max(1, Math.ceil(input.mastery / 25))), reasonKey: "recommendations.review", priority: 2 };
}

export function rewardForAttempt(isCorrect: boolean, responseTimeMs: number) { if (!isCorrect) return { xp: 2, coins: 0 }; const speedBonus = responseTimeMs <= 7000 ? 3 : 0; return { xp: 10 + speedBonus, coins: 3 + (speedBonus ? 1 : 0) }; }
export function masteryFrom(attempts: number, correctAnswers: number, responseTimeMs: number) { if (attempts === 0) return 0; const accuracy = (correctAnswers / attempts) * 100; const speedBoost = responseTimeMs <= 12000 ? 5 : 0; return Math.min(100, Math.round(accuracy * .9 + speedBoost)); }

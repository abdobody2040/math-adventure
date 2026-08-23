import { skillByKey, starterQuestionTemplates } from "../shared/learningContent";

export type QuestionPresentation =
  | { kind: "count"; amount: number; choices: string[] }
  | { kind: "compare"; left: number; right: number; choices: string[] }
  | { kind: "sequence"; values: (number | null)[]; choices: string[] }
  | { kind: "addition"; left: number; right: number; choices: string[] }
  | { kind: "subtraction"; left: number; right: number; choices: string[] };

export type GeneratedQuestion = {
  presentation: QuestionPresentation;
  correctAnswer: string;
  explanationKey: string;
};

function seededRandom(seed: string) {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

const randomInt = (min: number, max: number, random: () => number) => Math.floor(random() * (max - min + 1)) + min;

const shuffle = <T,>(items: T[], random: () => number) => [...items].sort(() => random() - 0.5);

const numericChoices = (answer: number, max: number, random: () => number) => {
  const choices = new Set<number>([answer]);
  while (choices.size < 4) {
    const offset = randomInt(-4, 4, random) || 1;
    const candidate = Math.max(0, Math.min(max, answer + offset));
    choices.add(candidate);
  }
  return shuffle(Array.from(choices), random).map(String);
};

export function generateQuestion(skillKey: string, difficulty: number, seed: string): GeneratedQuestion {
  const skill = skillByKey[skillKey];
  if (!skill) throw new Error("learning.error.unknownSkill");
  const template = starterQuestionTemplates.find(item => item.skillKey === skillKey && item.difficulty <= difficulty);
  if (!template) throw new Error("learning.error.templateUnavailable");
  const random = seededRandom(`${seed}:${template.key}:${difficulty}`);
  const generator = template.kind;

  const range = difficulty >= 3 ? 20 : 10;
  if (generator === "count") {
    const amount = randomInt(1, range, random);
    return {
      presentation: { kind: "count", amount, choices: numericChoices(amount, range, random) },
      correctAnswer: String(amount),
      explanationKey: "feedback.countExplanation",
    };
  }

  if (generator === "compare") {
    const left = randomInt(1, range, random);
    let right = randomInt(1, range, random);
    if (right === left) right = Math.min(range, right + 1);
    const answer = left > right ? ">" : "<";
    return {
      presentation: { kind: "compare", left, right, choices: ["<", ">", "="] },
      correctAnswer: answer,
      explanationKey: "feedback.compareExplanation",
    };
  }

  if (generator === "sequence") {
    const start = randomInt(1, range - 4, random);
    const answer = start + 2;
    return {
      presentation: { kind: "sequence", values: [start, start + 1, null, start + 3], choices: numericChoices(answer, range, random) },
      correctAnswer: String(answer),
      explanationKey: "feedback.sequenceExplanation",
    };
  }

  if (generator === "addition") {
    const max = skillKey === "add-within-20" ? 20 : 10;
    const left = randomInt(1, Math.floor(max / 2), random);
    const right = randomInt(1, max - left, random);
    const answer = left + right;
    return {
      presentation: { kind: "addition", left, right, choices: numericChoices(answer, max, random) },
      correctAnswer: String(answer),
      explanationKey: "feedback.additionExplanation",
    };
  }

  const max = skillKey === "subtract-within-20" ? 20 : 10;
  const left = randomInt(2, max, random);
  const right = randomInt(1, left - 1, random);
  const answer = left - right;
  return {
    presentation: { kind: "subtraction", left, right, choices: numericChoices(answer, max, random) },
    correctAnswer: String(answer),
    explanationKey: "feedback.subtractionExplanation",
  };
}

export function rewardForAttempt(isCorrect: boolean, responseTimeMs: number) {
  if (!isCorrect) return { xp: 2, coins: 0 };
  const speedBonus = responseTimeMs <= 7000 ? 3 : 0;
  return { xp: 10 + speedBonus, coins: 3 + (speedBonus ? 1 : 0) };
}

export function masteryFrom(attempts: number, correctAnswers: number, responseTimeMs: number) {
  if (attempts === 0) return 0;
  const accuracy = (correctAnswers / attempts) * 100;
  const speedBoost = responseTimeMs <= 12000 ? 5 : 0;
  return Math.min(100, Math.round(accuracy * 0.9 + speedBoost));
}

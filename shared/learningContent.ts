export type WorldDefinition = {
  key: string;
  order: number;
  nameKey: string;
  descriptionKey: string;
  accent: string;
  iconKey: string;
};

export type SkillDefinition = {
  key: string;
  worldKey: string;
  order: number;
  nameKey: string;
  generatorKey: "count" | "compare" | "sequence" | "addition" | "subtraction";
};

export const starterWorlds: WorldDefinition[] = [
  { key: "number-valley", order: 1, nameKey: "worlds.numberValley.name", descriptionKey: "worlds.numberValley.description", accent: "sky", iconKey: "sparkles" },
  { key: "addition-forest", order: 2, nameKey: "worlds.additionForest.name", descriptionKey: "worlds.additionForest.description", accent: "mint", iconKey: "trees" },
  { key: "subtraction-desert", order: 3, nameKey: "worlds.subtractionDesert.name", descriptionKey: "worlds.subtractionDesert.description", accent: "sun", iconKey: "sun" },
];

export const starterSkills: SkillDefinition[] = [
  { key: "count-to-20", worldKey: "number-valley", order: 1, nameKey: "skills.countTo20", generatorKey: "count" },
  { key: "number-recognition", worldKey: "number-valley", order: 2, nameKey: "skills.numberRecognition", generatorKey: "count" },
  { key: "compare-numbers", worldKey: "number-valley", order: 3, nameKey: "skills.compareNumbers", generatorKey: "compare" },
  { key: "number-sequences", worldKey: "number-valley", order: 4, nameKey: "skills.numberSequences", generatorKey: "sequence" },
  { key: "add-within-10", worldKey: "addition-forest", order: 1, nameKey: "skills.addWithin10", generatorKey: "addition" },
  { key: "make-ten", worldKey: "addition-forest", order: 2, nameKey: "skills.makeTen", generatorKey: "addition" },
  { key: "add-within-20", worldKey: "addition-forest", order: 3, nameKey: "skills.addWithin20", generatorKey: "addition" },
  { key: "subtract-within-10", worldKey: "subtraction-desert", order: 1, nameKey: "skills.subtractWithin10", generatorKey: "subtraction" },
  { key: "subtract-within-20", worldKey: "subtraction-desert", order: 2, nameKey: "skills.subtractWithin20", generatorKey: "subtraction" },
  { key: "number-bonds", worldKey: "subtraction-desert", order: 3, nameKey: "skills.numberBonds", generatorKey: "subtraction" },
];

export const starterLessons = starterSkills.map(skill => ({
  id: `lesson-${skill.key}`,
  skillKey: skill.key,
  titleKey: `lessons.${skill.key}.title`,
  objectiveKey: `lessons.${skill.key}.objective`,
  estimatedMinutes: 6,
  order: 1,
}));

export const starterQuestionTemplates = starterSkills.map(skill => ({
  key: `template-${skill.key}`,
  skillKey: skill.key,
  kind: skill.generatorKey,
  difficulty: 1,
}));

export const starterAchievements = [
  { key: "first-spark", titleKey: "achievements.firstSpark.title", descriptionKey: "achievements.firstSpark.description", iconKey: "sparkles" },
  { key: "three-day-streak", titleKey: "achievements.threeDayStreak.title", descriptionKey: "achievements.threeDayStreak.description", iconKey: "flame" },
  { key: "number-explorer", titleKey: "achievements.numberExplorer.title", descriptionKey: "achievements.numberExplorer.description", iconKey: "compass" },
];

export const starterQuest = { key: "daily-five", titleKey: "quests.dailyFive", target: 5, rewardXp: 25, rewardCoins: 10, isDaily: true };

export const skillByKey = Object.fromEntries(starterSkills.map(skill => [skill.key, skill]));

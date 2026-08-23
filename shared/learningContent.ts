export type WorldDefinition = { key: string; order: number; nameKey: string; descriptionKey: string; accent: string; iconKey: string };
export type GeneratorKey = "count" | "compare" | "sequence" | "addition" | "subtraction" | "multiplication" | "division" | "fraction" | "geometry" | "logic" | "wordProblem";
export type InteractionKind = "choice" | "numeric" | "trueFalse" | "ordering" | "matching" | "visual" | "timed" | "boss";
export type SkillDefinition = { key: string; worldKey: string; order: number; nameKey: string; generatorKey: GeneratorKey };
export type QuestionTemplateDefinition = { key: string; skillKey: string; kind: GeneratorKey; difficulty: number; interaction: InteractionKind };

export const starterWorlds: WorldDefinition[] = [
  { key: "number-valley", order: 1, nameKey: "worlds.numberValley.name", descriptionKey: "worlds.numberValley.description", accent: "sky", iconKey: "stars" },
  { key: "addition-forest", order: 2, nameKey: "worlds.additionForest.name", descriptionKey: "worlds.additionForest.description", accent: "mint", iconKey: "trees" },
  { key: "subtraction-desert", order: 3, nameKey: "worlds.subtractionDesert.name", descriptionKey: "worlds.subtractionDesert.description", accent: "sun", iconKey: "dunes" },
  { key: "multiplication-mountains", order: 4, nameKey: "worlds.multiplicationMountains.name", descriptionKey: "worlds.multiplicationMountains.description", accent: "violet", iconKey: "mountains" },
  { key: "division-kingdom", order: 5, nameKey: "worlds.divisionKingdom.name", descriptionKey: "worlds.divisionKingdom.description", accent: "coral", iconKey: "castle" },
  { key: "fraction-islands", order: 6, nameKey: "worlds.fractionIslands.name", descriptionKey: "worlds.fractionIslands.description", accent: "aqua", iconKey: "islands" },
  { key: "geometry-city", order: 7, nameKey: "worlds.geometryCity.name", descriptionKey: "worlds.geometryCity.description", accent: "rose", iconKey: "shapes" },
  { key: "logic-castle", order: 8, nameKey: "worlds.logicCastle.name", descriptionKey: "worlds.logicCastle.description", accent: "indigo", iconKey: "castle" },
];

const worldSkills = (worldKey: string, definitions: [string, string, GeneratorKey][]): SkillDefinition[] => definitions.map(([key, label, generatorKey], index) => ({ key, worldKey, order: index + 1, nameKey: `skills.${label}`, generatorKey }));
export const starterSkills: SkillDefinition[] = [
  ...worldSkills("number-valley", [["count-to-20", "countTo20", "count"], ["number-recognition", "numberRecognition", "count"], ["compare-numbers", "compareNumbers", "compare"], ["greater-less", "greaterLess", "compare"], ["number-sequences", "numberSequences", "sequence"]]),
  ...worldSkills("addition-forest", [["add-within-10", "addWithin10", "addition"], ["make-ten", "makeTen", "addition"], ["add-within-20", "addWithin20", "addition"], ["add-within-100", "addWithin100", "addition"], ["addition-word-problems", "additionWordProblems", "wordProblem"]]),
  ...worldSkills("subtraction-desert", [["subtract-within-10", "subtractWithin10", "subtraction"], ["mental-subtraction", "mentalSubtraction", "subtraction"], ["subtract-within-20", "subtractWithin20", "subtraction"], ["subtract-within-100", "subtractWithin100", "subtraction"], ["subtraction-word-problems", "subtractionWordProblems", "wordProblem"]]),
  ...worldSkills("multiplication-mountains", [["repeated-addition", "repeatedAddition", "multiplication"], ["multiplication-concepts", "multiplicationConcepts", "multiplication"], ["times-tables", "timesTables", "multiplication"], ["mental-multiplication", "mentalMultiplication", "multiplication"], ["multiplication-word-problems", "multiplicationWordProblems", "wordProblem"]]),
  ...worldSkills("division-kingdom", [["equal-groups", "equalGroups", "division"], ["division-concepts", "divisionConcepts", "division"], ["basic-division", "basicDivision", "division"], ["remainders", "remainders", "division"], ["division-word-problems", "divisionWordProblems", "wordProblem"]]),
  ...worldSkills("fraction-islands", [["fraction-concepts", "fractionConcepts", "fraction"], ["equivalent-fractions", "equivalentFractions", "fraction"], ["compare-fractions", "compareFractions", "fraction"], ["add-fractions", "addFractions", "fraction"], ["visual-fractions", "visualFractions", "fraction"]]),
  ...worldSkills("geometry-city", [["shapes", "shapes", "geometry"], ["angles", "angles", "geometry"], ["perimeter", "perimeter", "geometry"], ["area", "area", "geometry"], ["symmetry", "symmetry", "geometry"]]),
  ...worldSkills("logic-castle", [["patterns", "patterns", "logic"], ["logical-reasoning", "logicalReasoning", "logic"], ["logic-sequences", "logicSequences", "sequence"], ["problem-solving", "problemSolving", "logic"]]),
];

export const starterLessons = starterSkills.map(skill => ({ id: `lesson-${skill.key}`, skillKey: skill.key, titleKey: `lessons.${skill.key}.title`, objectiveKey: `lessons.${skill.key}.objective`, estimatedMinutes: 6, order: 1 }));
const interactionFor = (key: string): InteractionKind => {
  if (["number-recognition", "fraction-concepts", "visual-fractions", "shapes"].includes(key)) return "visual";
  if (["number-sequences", "logic-sequences"].includes(key)) return "ordering";
  if (key === "equivalent-fractions") return "matching";
  if (["logical-reasoning", "symmetry"].includes(key)) return "trueFalse";
  if (key.includes("word-problems")) return "timed";
  if (["make-ten", "perimeter", "area", "remainders"].includes(key)) return "numeric";
  return "choice";
};
export const starterQuestionTemplates: QuestionTemplateDefinition[] = starterSkills.map(skill => ({ key: `template-${skill.key}`, skillKey: skill.key, kind: skill.generatorKey, difficulty: 1, interaction: interactionFor(skill.key) }));

export const starterAchievements = [
  { key: "first-spark", titleKey: "achievements.firstSpark.title", descriptionKey: "achievements.firstSpark.description", iconKey: "sparkles" },
  { key: "three-day-streak", titleKey: "achievements.threeDayStreak.title", descriptionKey: "achievements.threeDayStreak.description", iconKey: "flame" },
  { key: "number-explorer", titleKey: "achievements.numberExplorer.title", descriptionKey: "achievements.numberExplorer.description", iconKey: "compass" },
  { key: "world-champion", titleKey: "achievements.worldChampion.title", descriptionKey: "achievements.worldChampion.description", iconKey: "crown" },
];
export const starterQuests = [
  { key: "daily-five", titleKey: "quests.dailyFive", target: 5, rewardXp: 25, rewardCoins: 10, isDaily: true },
  { key: "daily-lesson", titleKey: "quests.dailyLesson", target: 1, rewardXp: 20, rewardCoins: 8, isDaily: true },
  { key: "weekly-practice", titleKey: "quests.weeklyPractice", target: 5, rewardXp: 80, rewardCoins: 35, isDaily: false },
];
export const starterQuest = starterQuests[0];
export const starterBosses = starterWorlds.map(world => ({ worldKey: world.key, titleKey: `bosses.${world.key}`, health: 100, rewardXp: 60, rewardCoins: 25, badgeKey: "world-champion" }));
export const starterInventoryItems = [
  { key: "cosmic-backpack", titleKey: "inventory.cosmicBackpack", category: "backpack" as const, costCoins: 40, assetKey: "cosmic-backpack" },
  { key: "star-cape", titleKey: "inventory.starCape", category: "outfit" as const, costCoins: 60, assetKey: "star-cape" },
  { key: "mint-trail", titleKey: "inventory.mintTrail", category: "effect" as const, costCoins: 30, assetKey: "mint-trail" },
];
export const starterPets = [
  { key: "pico-owl", titleKey: "pets.pico.title", descriptionKey: "pets.pico.description", assetKey: "pico-owl", unlockCoins: 75 },
  { key: "nova-fox", titleKey: "pets.nova.title", descriptionKey: "pets.nova.description", assetKey: "nova-fox", unlockCoins: 100 },
];
export const skillByKey = Object.fromEntries(starterSkills.map(skill => [skill.key, skill]));

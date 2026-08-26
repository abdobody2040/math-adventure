import { starterWorlds } from "../shared/learningContent";
import { generateBossQuestion } from "./learningEngine";

export const BOSS_DAMAGE_PER_CORRECT_ANSWER = 34;

export function createBossQuestionDraft(worldKey: string, bossAttemptId: string, timestamp: number) {
  return generateBossQuestion(worldKey, 3, `${bossAttemptId}:${timestamp}`);
}

export function calculateBossHealth(currentHealth: number, isCorrect: boolean) {
  return isCorrect ? Math.max(0, currentHealth - BOSS_DAMAGE_PER_CORRECT_ANSWER) : currentHealth;
}

export function calculateBossCompletion(input: { worldKey: string; healthRemaining: number; rewardXp: number; rewardCoins: number; currentXp: number; currentCoins: number }) {
  const completed = input.healthRemaining === 0;
  const worldIndex = starterWorlds.findIndex(world => world.key === input.worldKey);
  const unlockedWorldKey = completed ? starterWorlds[worldIndex + 1]?.key ?? null : null;
  const xp = completed ? input.currentXp + input.rewardXp : input.currentXp;
  const coins = completed ? input.currentCoins + input.rewardCoins : input.currentCoins;
  return {
    completed,
    xp,
    coins,
    level: Math.floor(xp / 100) + 1,
    completionRewards: completed ? { xp: input.rewardXp, coins: input.rewardCoins, unlockedWorldKey } : { xp: 0, coins: 0, unlockedWorldKey: null },
  };
}

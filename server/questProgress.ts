export type QuestProgressEvent = "answer_submitted" | "learning_session_completed" | "boss_completed";

export type QuestProgressDefinition = {
  key: string;
  target: number;
};

const eventQuestKeys: Record<QuestProgressEvent, string[]> = {
  answer_submitted: ["daily-five", "weekly-practice"],
  learning_session_completed: ["daily-lesson"],
  boss_completed: ["weekly-battle"],
};

export function questProgressPlan(input: {
  event: QuestProgressEvent;
  quest: QuestProgressDefinition;
  currentProgress: number;
}) {
  const shouldPersist = eventQuestKeys[input.event].includes(input.quest.key);
  const currentProgress = Math.max(0, input.currentProgress);
  const progress = shouldPersist ? Math.min(input.quest.target, currentProgress + 1) : currentProgress;
  return { shouldPersist, progress, completed: progress >= input.quest.target };
}

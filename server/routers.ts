import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { consumeTutorHintAllowance } from "./tutorRateLimit";
import {
  createChild,
  createBossQuestion,
  createLearningSession,
  createQuestionSession,
  adminSaveQuestionTemplate,
  adminSaveQuest,
  adminSaveReward,
  adminSaveSkill,
  adminSaveWorld,
  completeLearningSession,
  getChildDashboard,
  getChildRewards,
  getParentPreferences,
  getWeeklyReport,
  getAdaptiveNextQuestion,
  getAdminAnalyticsSummary,
  getAdminContent,
  getCurriculum,
  listChildren,
  recordAnswer,
  recordBossAnswer,
  redeemInventoryItem,
  seedStarterContent,
  syncOfflineAnswers,
  startBossAttempt,
  softDeleteChild,
  unlockPet,
  updateParentPreferences,
  updateChild,
  exportChildData,
} from "./db";
import { generateQuestion } from "./learningEngine";
import { createTutorHint } from "./tutor";

const childIdInput = z.object({ childId: z.string().uuid() });

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "access.adminOnly" });
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: router({
    listChildren: protectedProcedure.query(({ ctx }) => listChildren(ctx.user.id)),
    createChild: protectedProcedure.input(z.object({
      displayName: z.string().trim().min(1).max(32),
      age: z.number().int().min(6).max(14),
      grade: z.string().trim().min(1).max(32),
      avatarKey: z.string().trim().min(1).max(64),
      locale: z.enum(["en", "ar"]),
    })).mutation(({ ctx, input }) => createChild(ctx.user.id, input)),
    updateChild: protectedProcedure.input(childIdInput.extend({
      displayName: z.string().trim().min(1).max(32).optional(),
      age: z.number().int().min(6).max(14).optional(),
      grade: z.string().trim().min(1).max(32).optional(),
      avatarKey: z.string().trim().min(1).max(64).optional(),
      locale: z.enum(["en", "ar"]).optional(),
    })).mutation(({ ctx, input }) => updateChild(ctx.user.id, input.childId, input)),
    deleteChild: protectedProcedure.input(childIdInput).mutation(({ ctx, input }) => softDeleteChild(ctx.user.id, input.childId)),
    exportChild: protectedProcedure.input(childIdInput).query(({ ctx, input }) => exportChildData(ctx.user.id, input.childId)),
    weeklyReport: protectedProcedure.input(childIdInput).query(({ ctx, input }) => getWeeklyReport(ctx.user.id, input.childId)),
    preferences: protectedProcedure.query(({ ctx }) => getParentPreferences(ctx.user.id)),
    updatePreferences: protectedProcedure.input(z.object({ weeklyReportEnabled: z.boolean().optional(), learningReminderEnabled: z.boolean().optional(), dataExportAllowed: z.boolean().optional() })).mutation(({ ctx, input }) => updateParentPreferences(ctx.user.id, input)),
  }),
  learning: router({
    curriculum: protectedProcedure.query(() => getCurriculum()),
    dashboard: protectedProcedure.input(childIdInput).query(({ ctx, input }) => getChildDashboard(ctx.user.id, input.childId)),
    nextQuestion: protectedProcedure.input(childIdInput.extend({ skillKey: z.string().min(1).max(64).optional() }))
      .mutation(async ({ ctx, input }) => {
        const adaptive = await getAdaptiveNextQuestion(ctx.user.id, { childId: input.childId, requestedSkillKey: input.skillKey });
        const sessionId = randomUUID();
        const generated = generateQuestion(adaptive.skillKey, adaptive.difficulty, sessionId, adaptive.activity);
        const presentation = { ...generated.presentation, activity: adaptive.activity };
        const session = await createQuestionSession(ctx.user.id, input.childId, adaptive.skillKey, presentation, generated.correctAnswer, sessionId);
        return { questionSessionId: session.id, expiresAt: session.expiresAt, presentation, explanationKey: generated.explanationKey, adaptive };
      }),
    startSession: protectedProcedure.input(childIdInput.extend({ skillKey: z.string().min(1).max(64), mode: z.enum(["lesson", "battle"]) }))
      .mutation(({ ctx, input }) => createLearningSession(ctx.user.id, input)),
    completeSession: protectedProcedure.input(childIdInput.extend({ sessionId: z.string().uuid(), durationSeconds: z.number().int().min(0).max(15 * 60) }))
      .mutation(({ ctx, input }) => completeLearningSession(ctx.user.id, input)),
    submitAnswer: protectedProcedure.input(childIdInput.extend({
      questionSessionId: z.string().uuid(), answer: z.string().trim().min(1).max(32), responseTimeMs: z.number().int().min(0).max(15 * 60 * 1000), usedHint: z.boolean().default(false),
    })).mutation(({ ctx, input }) => recordAnswer(ctx.user.id, input)),
    boss: router({
      start: protectedProcedure.input(childIdInput.extend({ worldKey: z.string().min(1).max(64) })).mutation(({ ctx, input }) => startBossAttempt(ctx.user.id, input)),
      nextQuestion: protectedProcedure.input(childIdInput.extend({ bossAttemptId: z.string().uuid() })).mutation(({ ctx, input }) => createBossQuestion(ctx.user.id, input)),
      submitAnswer: protectedProcedure.input(childIdInput.extend({ bossAttemptId: z.string().uuid(), questionSessionId: z.string().uuid(), answer: z.string().trim().min(1).max(32), responseTimeMs: z.number().int().min(0).max(15 * 60 * 1000), usedHint: z.boolean().default(false) })).mutation(({ ctx, input }) => recordBossAnswer(ctx.user.id, input)),
    }),
  }),
  rewards: router({
    collection: protectedProcedure.input(childIdInput).query(({ ctx, input }) => getChildRewards(ctx.user.id, input.childId)),
    redeemItem: protectedProcedure.input(childIdInput.extend({ itemKey: z.string().min(1).max(64) })).mutation(({ ctx, input }) => redeemInventoryItem(ctx.user.id, input)),
    unlockPet: protectedProcedure.input(childIdInput.extend({ petKey: z.string().min(1).max(64) })).mutation(({ ctx, input }) => unlockPet(ctx.user.id, input)),
  }),
  tutor: router({
    hint: protectedProcedure.input(childIdInput.extend({ skillKey: z.string().min(1).max(64), presentation: z.unknown(), locale: z.enum(["en", "ar"]) })).mutation(async ({ ctx, input }) => {
      await getChildDashboard(ctx.user.id, input.childId);
      const allowance = consumeTutorHintAllowance(`${ctx.user.id}:${input.childId}`);
      if (!allowance.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `tutor.rateLimited:${allowance.retryAfterSeconds}` });
      return { hint: await createTutorHint({ skillKey: input.skillKey, presentation: input.presentation, locale: input.locale }) };
    }),
  }),
  sync: router({
    answers: protectedProcedure.input(childIdInput.extend({ operations: z.array(z.object({ idempotencyKey: z.string().uuid(), questionSessionId: z.string().uuid(), answer: z.string().trim().min(1).max(32), responseTimeMs: z.number().int().min(0).max(15 * 60 * 1000), usedHint: z.boolean() })).max(20) })).mutation(({ ctx, input }) => syncOfflineAnswers(ctx.user.id, input)),
  }),
  admin: router({
    seedStarterContent: adminProcedure.mutation(() => seedStarterContent()),
    analytics: adminProcedure.query(() => getAdminAnalyticsSummary()),
    content: adminProcedure.query(() => getAdminContent()),
    saveWorld: adminProcedure.input(z.object({ key: z.string().min(1).max(64), order: z.number().int().min(1), nameKey: z.string().min(1).max(128), descriptionKey: z.string().min(1).max(128), accent: z.string().min(1).max(32), iconKey: z.string().min(1).max(64), isPublished: z.boolean() })).mutation(({ input }) => adminSaveWorld(input)),
    saveSkill: adminProcedure.input(z.object({ key: z.string().min(1).max(64), worldKey: z.string().min(1).max(64), order: z.number().int().min(1), nameKey: z.string().min(1).max(128), generatorKey: z.string().min(1).max(64), isPublished: z.boolean() })).mutation(({ input }) => adminSaveSkill(input)),
    saveQuestionTemplate: adminProcedure.input(z.object({ key: z.string().min(1).max(64), skillKey: z.string().min(1).max(64), kind: z.string().min(1).max(64), difficulty: z.number().int().min(1).max(5), isEnabled: z.boolean() })).mutation(({ input }) => adminSaveQuestionTemplate(input)),
    saveQuest: adminProcedure.input(z.object({ key: z.string().min(1).max(64), titleKey: z.string().min(1).max(128), target: z.number().int().min(1), rewardXp: z.number().int().min(0), rewardCoins: z.number().int().min(0), isDaily: z.boolean(), isEnabled: z.boolean() })).mutation(({ input }) => adminSaveQuest(input)),
    saveReward: adminProcedure.input(z.object({ key: z.string().min(1).max(64), titleKey: z.string().min(1).max(128), category: z.enum(["outfit", "accessory", "backpack", "effect", "pet"]), costCoins: z.number().int().min(0), assetKey: z.string().min(1).max(64), isPublished: z.boolean() })).mutation(({ input }) => adminSaveReward(input)),
  }),
});

export type AppRouter = typeof appRouter;

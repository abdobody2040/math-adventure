import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createChild,
  createLearningSession,
  createQuestionSession,
  completeLearningSession,
  getChildDashboard,
  getCurriculum,
  listChildren,
  recordAnswer,
  seedStarterContent,
  updateChild,
} from "./db";
import { generateQuestion } from "./learningEngine";

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
  }),
  learning: router({
    curriculum: protectedProcedure.query(() => getCurriculum()),
    dashboard: protectedProcedure.input(childIdInput).query(({ ctx, input }) => getChildDashboard(ctx.user.id, input.childId)),
    nextQuestion: protectedProcedure.input(childIdInput.extend({ skillKey: z.string().min(1).max(64), difficulty: z.number().int().min(1).max(5).default(1) }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = randomUUID();
        const generated = generateQuestion(input.skillKey, input.difficulty, sessionId);
        const session = await createQuestionSession(ctx.user.id, input.childId, input.skillKey, generated.presentation, generated.correctAnswer, sessionId);
        return { questionSessionId: session.id, expiresAt: session.expiresAt, presentation: generated.presentation, explanationKey: generated.explanationKey };
      }),
    startSession: protectedProcedure.input(childIdInput.extend({ skillKey: z.string().min(1).max(64), mode: z.enum(["lesson", "battle"]) }))
      .mutation(({ ctx, input }) => createLearningSession(ctx.user.id, input)),
    completeSession: protectedProcedure.input(childIdInput.extend({ sessionId: z.string().uuid(), durationSeconds: z.number().int().min(0).max(15 * 60) }))
      .mutation(({ ctx, input }) => completeLearningSession(ctx.user.id, input)),
    submitAnswer: protectedProcedure.input(childIdInput.extend({
      questionSessionId: z.string().uuid(), answer: z.string().trim().min(1).max(32), responseTimeMs: z.number().int().min(0).max(15 * 60 * 1000), usedHint: z.boolean().default(false),
    })).mutation(({ ctx, input }) => recordAnswer(ctx.user.id, input)),
  }),
  admin: router({
    seedStarterContent: adminProcedure.mutation(() => seedStarterContent()),
  }),
});

export type AppRouter = typeof appRouter;

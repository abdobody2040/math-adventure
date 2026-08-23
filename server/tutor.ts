import { invokeLLM } from "./_core/llm";

export async function createTutorHint(input: { skillKey: string; presentation: unknown; locale: "en" | "ar" }) {
  const language = input.locale === "ar" ? "Arabic" : "English";
  const response = await invokeLLM({
    messages: [
      { role: "system", content: `You are a child-safe math practice guide. Reply only in ${language}. Give one warm strategy hint in at most 45 words. Do not ask for names, age, location, contact details, or personal stories. Do not mention adult topics. Do not reveal the final answer. Do not claim to be human. Use simple language for ages 6–14.` },
      { role: "user", content: `Skill: ${input.skillKey}. Question data: ${JSON.stringify(input.presentation)}. Give a strategy hint only.` },
    ],
  });
  const text = response.choices?.[0]?.message?.content;
  return typeof text === "string" && text.trim() ? text.trim().slice(0, 420) : "Try one small step at a time.";
}

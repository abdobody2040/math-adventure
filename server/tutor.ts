import { invokeLLM } from "./_core/llm";

const restrictedHintPatterns = [
  /final\s+answer|the\s+answer\s+is|answer\s*[:=]/i,
  /adult\s+topic|sex|dating|violence/i,
  /your\s+(name|age|address|location|phone|email)|tell\s+me\s+about\s+yourself/i,
];

export function sanitizeTutorHint(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.trim() || restrictedHintPatterns.some(pattern => pattern.test(value))) return fallback;
  return value.trim().split(/\s+/).slice(0, 45).join(" ");
}

export async function createTutorHint(input: { skillKey: string; presentation: unknown; locale: "en" | "ar" }) {
  const language = input.locale === "ar" ? "Arabic" : "English";
  const fallback = input.locale === "ar" ? "جرّب خطوة صغيرة واحدة في كل مرة." : "Try one small step at a time.";
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: `You are a child-safe math practice guide. Reply only in ${language}. Give one warm strategy hint in at most 45 words. Do not ask for names, age, location, contact details, or personal stories. Do not mention adult topics. Do not reveal the final answer. Do not claim to be human. Use simple language for ages 6–14.` },
        { role: "user", content: `Skill: ${input.skillKey}. Question data: ${JSON.stringify(input.presentation)}. Give a strategy hint only.` },
      ],
    });
    return sanitizeTutorHint(response.choices?.[0]?.message?.content, fallback);
  } catch {
    return fallback;
  }
}

import { OpenAiProvider } from "./openai";
import type { LlmProvider, LlmRequest, LlmResponse, LlmTask } from "./types";

let cached: LlmProvider | null = null;

export function getLlmProvider(): LlmProvider {
  if (cached) return cached;
  const name = process.env.LLM_PROVIDER ?? "openai";
  switch (name) {
    case "openai":
      cached = new OpenAiProvider();
      return cached;
    default:
      throw new Error(
        `Unsupported LLM_PROVIDER: ${name}. Add a new adapter in lib/llm/.`
      );
  }
}

export const defaultPrompts: Record<LlmTask, string> = {
  summary:
    "אתה עורך עיוני המסכם מאמר תורני. כתוב תקציר עברי תמציתי (4-6 משפטים) השומר על נאמנות למקור ועל סגנון מכובד. אין להוסיף פרשנות אישית.",
  edited:
    "אתה עורך לשוני. ערוך את המאמר הבא לשיפור קריאות, ניקוד פיסוק וחלוקה לפסקאות, מבלי לשנות את התוכן, הציטוטים והמשמעות. שמור על הסגנון התורני המקורי. החזר רק טקסט HTML עם תגיות מינימליות (p, h2, blockquote, em, strong).",
  translate:
    "Translate the following Hebrew Torah-thought article into the requested target language. Preserve quotations, Hebrew terms in transliteration in parentheses, and a respectful tone. Return clean HTML with minimal tags.",
};

export type { LlmProvider, LlmRequest, LlmResponse, LlmTask };

import type { LlmProvider, LlmRequest, LlmResponse } from "./types";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";

  constructor(private readonly model: string = process.env.LLM_MODEL ?? "gpt-4o-mini") {}

  async generate(req: LlmRequest): Promise<LlmResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: req.prompt },
          { role: "user", content: req.text },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${detail}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const output = data.choices?.[0]?.message?.content?.trim() ?? "";
    return {
      output,
      model: this.model,
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      },
    };
  }
}

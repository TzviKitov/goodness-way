export type LlmTask = "summary" | "edited" | "translate";

export type LlmRequest = {
  task: LlmTask;
  prompt: string;
  text: string;
  locale?: string;
};

export type LlmResponse = {
  output: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export interface LlmProvider {
  readonly name: string;
  generate(req: LlmRequest): Promise<LlmResponse>;
}

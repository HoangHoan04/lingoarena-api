import { configEnv } from '~/config/env';

export type AiGradeResult = {
  overallScore: number;
  generalFeedback: string;
  criterionScores: Array<{ code: string; score: number; comment?: string }>;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  rawContent?: string;
};

function parseJsonObject(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}

export async function gradeWithChatCompletion(input: {
  prompt: string;
}): Promise<AiGradeResult | null> {
  const env = configEnv();
  const openaiKey = env.OPENAI_API_KEY;
  const azureKey = env.AZURE_OPENAI_KEY;
  if (!openaiKey && !azureKey) return null;

  const started = Date.now();
  let url = 'https://api.openai.com/v1/chat/completions';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let model = 'gpt-4o-mini';
  if (azureKey && env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_DEPLOYMENT) {
    const base = env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, '');
    url = `${base}/openai/deployments/${env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`;
    headers['api-key'] = azureKey;
    model = env.AZURE_OPENAI_DEPLOYMENT;
  } else if (openaiKey) {
    headers.Authorization = `Bearer ${openaiKey}`;
  } else {
    return null;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You are an exam grader. Reply with JSON only: {"overallScore":number,"generalFeedback":string,"criterionScores":[{"code":string,"score":number,"comment":string}]}',
        },
        { role: 'user', content: input.prompt },
      ],
    }),
  });
  const payload = (await response.json()) as Record<string, any>;
  const content = payload?.choices?.[0]?.message?.content || '{}';
  const parsed = parseJsonObject(String(content));
  const criterionScores = Array.isArray(parsed.criterionScores)
    ? parsed.criterionScores.map((item: any) => ({
        code: String(item?.code || ''),
        score: Number(item?.score || 0),
        comment: item?.comment ? String(item.comment) : undefined,
      }))
    : [];
  return {
    overallScore: Number(parsed.overallScore || parsed.band || 0),
    generalFeedback: String(parsed.generalFeedback || parsed.feedback || ''),
    criterionScores,
    modelUsed: model,
    promptTokens: Number(payload?.usage?.prompt_tokens || 0),
    completionTokens: Number(payload?.usage?.completion_tokens || 0),
    durationMs: Date.now() - started,
    rawContent: String(content),
  };
}

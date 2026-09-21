export interface TUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface TGenerateJsonResult {
  data: unknown;
  usage: TUsage;
}

const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-flash';

// DeepSeek поддерживает только json_object: соответствие нашей схеме он не гарантирует,
// поэтому ответ обязательно проверяется на нашей стороне
export const generateJson = async (prompt: string): Promise<TGenerateJsonResult> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek ответил ${response.status}`);
  }

  const body = await response.json() as {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  return {
    data: JSON.parse(body.choices[0].message.content),
    usage: {
      inputTokens: body.usage?.prompt_tokens ?? 0,
      outputTokens: body.usage?.completion_tokens ?? 0,
    },
  };
};

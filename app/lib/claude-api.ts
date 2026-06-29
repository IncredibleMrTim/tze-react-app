interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
}

interface ClaudeResponse {
  content: Array<{
    type: string;
    text?: string;
  }>;
}

/**
 * Calls the Claude API with an image and system prompt
 */
export async function callClaudeWithImage(params: {
  base64Data: string;
  systemPrompt: string;
  maxTokens: number;
  apiKey: string;
}): Promise<string> {
  const { base64Data, systemPrompt, maxTokens, apiKey } = params;

  console.log('📸 Image data length:', base64Data.length);
  console.log('📸 Image data starts with:', base64Data.substring(0, 50));
  console.log('📸 Max tokens:', maxTokens);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Data,
            },
          },
          { type: 'text', text: 'Return JSON only.' },
        ],
      }] as ClaudeMessage[],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude API error ${response.status}: ${text}`);
  }

  const data: ClaudeResponse = await response.json();

  // Extract text from response
  let text = '';
  if (data.content && Array.isArray(data.content)) {
    data.content.forEach(block => {
      if (block.type === 'text' && block.text) {
        text += block.text;
      }
    });
  }

  // Clean up markdown code blocks
  return text.replace(/```json|```/g, '').trim();
}

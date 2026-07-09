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
 * Calls the Claude API with one or more images and system prompt
 * Supports multi-page PO documents
 */
export async function callClaudeWithImage(params: {
  base64DataArray: string[];
  systemPrompt: string;
  maxTokens: number;
  apiKey: string;
}): Promise<string> {
  const { base64DataArray, systemPrompt, maxTokens, apiKey } = params;

  console.log('📸 Processing', base64DataArray.length, 'page(s)');
  console.log('📸 Max tokens:', maxTokens);

  // Build content array with all images
  const content: Array<{ type: string; source?: { type: string; media_type: string; data: string }; text?: string }> = [];

  // Add all images
  base64DataArray.forEach((base64Data, index) => {
    console.log(`📸 Page ${index + 1} data length:`, base64Data.length);
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: base64Data,
      },
    });
  });

  // Add text prompt at the end
  content.push({
    type: 'text',
    text: base64DataArray.length > 1
      ? 'These images are all pages from the same Purchase Order. Combine all parts from all pages. Return JSON only.'
      : 'Return JSON only.'
  });

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
        content,
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

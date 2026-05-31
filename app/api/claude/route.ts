import { NextRequest, NextResponse } from 'next/server';
import { callClaudeWithImage } from '@/lib/claude-api';

export async function POST(request: NextRequest) {
  try {
    const { b64data, systemPrompt, maxTokens } = await request.json();

    // Get API key from environment or user-provided key from headers
    const userApiKey = request.headers.get('x-user-api-key');
    const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key configured' },
        { status: 401 }
      );
    }

    const result = await callClaudeWithImage({
      base64Data: b64data,
      systemPrompt,
      maxTokens,
      apiKey,
    });

    return NextResponse.json({ result });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

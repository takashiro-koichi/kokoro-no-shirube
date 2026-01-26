import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

const KEYWORD_PROMPT = `以下の夢の内容から、夢占いで重要なキーワードを3〜6個抽出してください。

## 抽出のポイント
- 登場人物（人、動物など）
- 場所・環境
- 行動・状況
- 感情・印象
- 象徴的なモノ

## 出力形式
必ず以下のJSON形式で出力してください：
{
  "keywords": ["キーワード1", "キーワード2", "キーワード3"]
}

JSONのみを出力してください。他の文章は不要です。`;

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `${KEYWORD_PROMPT}\n\n---\n夢の内容:\n${content}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // JSONをパース
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to parse response' },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('JSON parse error:', jsonMatch[0]);
      return NextResponse.json(
        { error: 'Failed to parse AI response JSON' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      keywords: parsed.keywords || [],
    });
  } catch (error) {
    console.error('Keywords extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract keywords' },
      { status: 500 }
    );
  }
}

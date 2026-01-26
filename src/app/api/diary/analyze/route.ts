import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANALYZE_PROMPT = `以下の日記を分析して、感情タグと一行要約を生成してください。

## 感情タグについて
- 日記の内容から感じられる感情を2〜4個のタグで表現
- 例: 「嬉しい」「感謝」「疲れた」「不安」「達成感」「リラックス」など
- ポジティブ・ネガティブ両方を含めてOK

## 一行要約について
- 日記の内容を20〜40文字程度で要約
- タイムライン表示用なので、その日何があったかが分かる内容

## 出力形式
必ず以下のJSON形式で出力してください：
{
  "emotion_tags": ["タグ1", "タグ2"],
  "summary": "一行要約テキスト"
}

JSONのみを出力してください。`;

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'content は必須です' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${ANALYZE_PROMPT}\n\n---\n\n${content}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // JSONをパース
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSONの抽出に失敗しました');
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('JSON parse error:', jsonMatch[0]);
      throw new Error('AIレスポンスのJSONパースに失敗しました');
    }

    return NextResponse.json({
      summary: result.summary || '',
      emotion_tags: result.emotion_tags || [],
    });
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: '分析処理に失敗しました' },
      { status: 500 }
    );
  }
}

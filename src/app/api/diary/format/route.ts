import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { VoiceFormatLevel } from '@/lib/supabase/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const prompts: Record<VoiceFormatLevel, string> = {
  light: `以下の音声文字起こしテキストを軽く整形してください。
- 「えーと」「あのー」などのフィラーを除去
- 句読点を適切に追加
- 文章の意味は変えない
- できるだけ元の話し言葉の雰囲気を残す

整形後のテキストのみを出力してください。`,

  thorough: `以下の音声文字起こしテキストを読みやすい文章に整形してください。
- フィラーを除去
- 文章として自然に読めるように再構成
- 話し言葉を適度に書き言葉に変換
- 意味は変えない

整形後のテキストのみを出力してください。`,

  bullet: `以下の音声文字起こしテキストを箇条書きに整形してください。
- 要点を抽出して箇条書きにする
- 各項目は簡潔に
- 「・」で始める
- 重要な情報を漏らさない

箇条書きのテキストのみを出力してください。`,
};

export async function POST(request: NextRequest) {
  try {
    const { text, level } = await request.json();

    if (!text || !level) {
      return NextResponse.json(
        { error: 'text と level は必須です' },
        { status: 400 }
      );
    }

    if (!['light', 'thorough', 'bullet'].includes(level)) {
      return NextResponse.json(
        { error: '無効な level です' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `${prompts[level as VoiceFormatLevel]}\n\n---\n\n${text}`,
        },
      ],
    });

    const formatted =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ formatted });
  } catch (error) {
    console.error('Format API error:', error);
    return NextResponse.json(
      { error: '整形処理に失敗しました' },
      { status: 500 }
    );
  }
}

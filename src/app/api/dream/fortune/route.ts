import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkFortuneLimit, incrementFortuneUsage } from '@/lib/supabase/queries';
import type { FortuneStyle } from '@/lib/supabase/types';

const client = new Anthropic();

const FORTUNE_PROMPTS: Record<FortuneStyle, string> = {
  jung: `あなたはユング派の夢分析の専門家です。
以下の夢を分析し、象徴・集合的無意識の観点から解釈してください。

## 分析の視点
- 夢に登場するシンボルの意味（集合的無意識、元型）
- 自己実現・成長へのメッセージ
- 影（シャドウ）やアニマ/アニムスの表れ
- 個性化（インディビデュエーション）のプロセス

## 出力形式
- 300〜500文字程度で、親しみやすい文体で解釈を提示
- 「あなたの夢は〜」のような語りかけ形式
- 具体的なアドバイスや気づきを含める
- 必ず日本語で回答すること`,

  freud: `あなたはフロイト派の夢分析の専門家です。
以下の夢を分析し、願望・抑圧の観点から解釈してください。

## 分析の視点
- 潜在的な願望や欲求の表れ
- 抑圧された感情や記憶
- 日常で意識していない本音
- リビドー（生命エネルギー）の働き

## 出力形式
- 300〜500文字程度で、親しみやすい文体で解釈を提示
- 「あなたの夢は〜」のような語りかけ形式
- 具体的なアドバイスや気づきを含める
- 必ず日本語で回答すること`,

  cognitive: `あなたは認知科学的アプローチで夢を分析する専門家です。
以下の夢を分析し、日常との関連や問題解決の観点から解釈してください。

## 分析の視点
- 最近の出来事や経験との関連
- 脳が情報を整理するプロセス
- 現実の課題や悩みとの接続
- 実用的な気づきやアドバイス

## 出力形式
- 300〜500文字程度で、親しみやすい文体で解釈を提示
- 「あなたの夢は〜」のような語りかけ形式
- 具体的で実行可能なアドバイスを含める
- 必ず日本語で回答すること`,
};

interface GlossaryItem {
  name: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const { content, keywords, style, glossary } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    if (!style || !['jung', 'freud', 'cognitive'].includes(style)) {
      return NextResponse.json(
        { error: 'valid style is required (jung, freud, cognitive)' },
        { status: 400 }
      );
    }

    // 認証チェック
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // API制限チェック
    const limitStatus = await checkFortuneLimit(supabase, user.id);
    if (!limitStatus.canUse) {
      return NextResponse.json(
        {
          error: '本日の夢占い回数上限（20回）に達しました。明日またお試しください。',
          code: 'LIMIT_EXCEEDED',
          remainingCount: 0,
        },
        { status: 429 }
      );
    }

    // プロンプト構築
    let prompt = FORTUNE_PROMPTS[style as FortuneStyle];

    // 固有名詞があれば追加
    if (glossary && Array.isArray(glossary) && glossary.length > 0) {
      const glossaryText = (glossary as GlossaryItem[])
        .map((item) => `- ${item.name}: ${item.description}`)
        .join('\n');
      prompt += `\n\n## 夢に登場する人物・固有名詞の情報\n${glossaryText}`;
    }

    // キーワードがあれば追加
    if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      prompt += `\n\n## 抽出されたキーワード\n${keywords.join('、')}`;
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n---\n夢の内容:\n${content}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // API使用回数をインクリメント
    await incrementFortuneUsage(supabase, user.id);

    // 最新の残り回数を取得
    const newLimitStatus = await checkFortuneLimit(supabase, user.id);

    return NextResponse.json({
      fortune: responseText,
      remainingCount: newLimitStatus.remainingCount,
    });
  } catch (error) {
    console.error('Fortune telling error:', error);
    return NextResponse.json(
      { error: 'Failed to tell fortune' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. 関連データを削除（RLSにより自動的に自分のデータのみ削除される）
    // 順序: 子テーブル → 親テーブル

    // 夢のキーワードを削除（dreamsに依存）
    await supabase
      .from('dream_keywords')
      .delete()
      .eq('user_id', user.id);

    // API使用量を削除
    await supabase
      .from('api_usage')
      .delete()
      .eq('user_id', user.id);

    // 夢記録を削除
    await supabase
      .from('dreams')
      .delete()
      .eq('user_id', user.id);

    // 日記を削除
    await supabase
      .from('diaries')
      .delete()
      .eq('user_id', user.id);

    // ウィッシュリストを削除
    await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id);

    // 固有名詞を削除
    await supabase
      .from('user_glossary')
      .delete()
      .eq('user_id', user.id);

    // ユーザー属性を削除
    await supabase
      .from('user_attributes')
      .delete()
      .eq('user_id', user.id);

    // ユーザー設定を削除
    await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', user.id);

    // ユーザープロフィールを削除
    await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    // 2. 認証ユーザーを削除（Supabase Admin APIが必要だが、ここではサインアウトのみ）
    // 注意: 実際のアカウント削除にはService Role Keyを使用したサーバーサイドの処理が必要
    // ここではデータのみ削除し、認証アカウントはSupabase側で削除するか、
    // Edge FunctionやWebhookを使用する必要がある

    // サインアウト
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}

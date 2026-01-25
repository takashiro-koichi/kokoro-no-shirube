import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/supabase/queries';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/home';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ユーザー情報を取得
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // ユーザープロフィールが存在するかチェック
        const profile = await getUserProfile(supabase, user.id);

        if (!profile) {
          // 初期登録未完了の場合はオンボーディングへ
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // エラー時はログインページへ
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

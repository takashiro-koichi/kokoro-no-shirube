import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 認証が必要なルート（/app/*）への未認証アクセス
  if (pathname.startsWith('/app') && !user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 認証済みで /login へアクセスした場合
  if (pathname === '/login' && user) {
    // プロフィール存在チェック
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      // オンボーディング未完了
      const onboardingUrl = new URL('/onboarding', request.url);
      return NextResponse.redirect(onboardingUrl);
    }

    const homeUrl = new URL('/app/home', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // /onboarding への未認証アクセス
  if (pathname === '/onboarding' && !user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 認証済みで /app/* へアクセスした場合、オンボーディングチェック
  if (pathname.startsWith('/app') && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      // オンボーディング未完了
      const onboardingUrl = new URL('/onboarding', request.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  // オンボーディング完了済みで /onboarding へアクセス
  if (pathname === '/onboarding' && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profile) {
      // すでにオンボーディング完了済み
      const homeUrl = new URL('/app/home', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return supabaseResponse;
}

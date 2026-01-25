import Link from 'next/link';
import { BookOpen, Moon, Star, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Google Icon SVG Component
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// 構造化データ（JSON-LD）
function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'こころのしるべ',
    description:
      '日々の感情を記録し、夢をAIで占い、ウィッシュリストで目標を管理。あなたの心の道標となるサービスです。',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
    featureList: [
      '日記記録（音声入力対応）',
      'AI感情分析',
      '夢記録・AI夢占い',
      'ウィッシュリスト管理',
      'カレンダー・タイムライン表示',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

const features = [
  {
    icon: BookOpen,
    title: '日記で感情を整理',
    description:
      '音声入力でかんたんに記録。AIが感情を分析してタグ付け、一行要約を自動生成します。',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    icon: Moon,
    title: '夢をAIで占う',
    description:
      '見た夢を記録し、ユング派・フロイト派・認知的アプローチから選べるAI夢占いで心を読み解きます。',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    icon: Star,
    title: 'ウィッシュリストで目標管理',
    description:
      '年収や年齢などの条件を設定し、達成可能になったらお知らせ。目標達成をサポートします。',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
  },
  {
    icon: Calendar,
    title: '振り返りで成長を実感',
    description:
      'カレンダーやタイムラインで過去の記録を振り返り。検索・フィルタで必要な記録をすぐに見つけられます。',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
];

export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        {/* ヘッダー */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary">こころのしるべ</h1>
            <Link href="/login">
              <Button variant="outline" size="sm">
                ログイン
              </Button>
            </Link>
          </nav>
        </header>

        {/* ヒーローセクション */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AIがあなたの心をサポート
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              心の道標となる
              <br />
              <span className="text-primary">記録アプリ</span>
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              日々の感情を記録し、夢をAIで占い、ウィッシュリストで目標を管理。
              <br className="hidden md:block" />
              あなたの毎日を豊かにする、心の道標となるサービスです。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  <GoogleIcon />
                  Googleで無料ではじめる
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              アカウント登録は無料・クレジットカード不要
            </p>
          </div>
        </section>

        {/* 機能紹介セクション */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">主な機能</h3>
            <p className="text-muted-foreground">
              AIの力を借りて、日々の記録をもっと価値あるものに
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${feature.bgColor} flex-shrink-0`}
                    >
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTAセクション */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-primary text-primary-foreground border-0 max-w-3xl mx-auto">
            <CardContent className="p-8 md:p-12 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                今日から始めよう
              </h3>
              <p className="mb-8 opacity-90">
                毎日がどんどん過ぎていってしまう...
                <br />
                そんなあなたに、心の道標を。
              </p>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  <GoogleIcon />
                  無料で始める
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* フッター */}
        <footer className="container mx-auto px-4 py-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; 2025 こころのしるべ. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                プライバシーポリシー
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

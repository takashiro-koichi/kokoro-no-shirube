# こころのしるべ

心の道標となる日記・夢記録・ウィッシュリスト管理サービス

## 概要

「毎日がどんどん過ぎていってしまう」という課題に対し、日々の良かったこと・悪かったことを記録して振り返り、ウィッシュリストで人生を豊かにすることを目的としたアプリケーションです。

## 主な機能

- **日記**: 音声・テキストで日々を記録、AI感情タグ・要約生成
- **夢記録**: 夢を記録し、AIによる夢占い機能（ユング派/フロイト派/認知的アプローチ）
- **ウィッシュリスト**: 条件付き目標管理（年収、年齢などの条件で実施可能判定）
- **振り返り**: カレンダー・タイムラインでの閲覧、検索・フィルタ
- **統計**: 月別記録数、感情タグ分布、夢キーワード分析

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| DB | Supabase (PostgreSQL) |
| 認証 | Supabase Authentication (Google OAuth) |
| LLM | Anthropic Claude API |
| 音声入力 | Web Speech API |
| UIライブラリ | shadcn/ui |
| アニメーション | Three.js |
| ホスティング | Vercel |

## 開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# リント
npm run lint
```

## 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## ライセンス

Private

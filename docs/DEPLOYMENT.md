# DEPLOYMENT.md - デプロイフロー

## 本番環境

- **URL**: https://kokoro-no-shirube.vercel.app
- **ホスティング**: Vercel
- **自動デプロイ**: mainブランチへのマージで自動実行

---

## 通常のデプロイフロー

### 1. featureブランチを作成

```bash
git checkout main
git pull origin main
git checkout -b feature/機能名
```

### 2. 開発・コミット

```bash
# 変更を加える
git add .
git commit -m "feat: 機能の説明"
```

### 3. プッシュ

```bash
git push -u origin feature/機能名
```

### 4. PRを作成

```bash
gh pr create --title "タイトル" --body "説明"
```

または GitHub の Web UI から作成

### 5. マージ

以下のいずれかの方法でマージ:

- **GitHub管理画面**: PRページで「Merge pull request」をクリック
- **Claudeに依頼**: 「PRをマージして」と伝える

### 6. 自動デプロイ

mainブランチへのマージ後、Vercelが自動的にデプロイを実行

---

## 緊急時のデプロイ（Vercel CLI）

PRを経由せず、ローカルから直接デプロイする方法。

### 前提条件

```bash
# Vercel CLIがインストールされていること
npm i -g vercel

# プロジェクトがリンクされていること
vercel link
```

### 本番デプロイ

```bash
vercel --prod
```

### プレビューデプロイ（確認用）

```bash
vercel
```

### デプロイ状況確認

```bash
vercel ls
```

### ログ確認

```bash
vercel logs [デプロイURL]
```

---

## 環境変数の管理

### 一覧表示

```bash
vercel env ls
```

### 追加

```bash
echo "値" | vercel env add 変数名 production
```

### 削除

```bash
vercel env rm 変数名 production
```

### ローカルに反映

```bash
vercel env pull
```

---

## 注意事項

- 緊急デプロイは履歴がGitに残らないため、後でコミット・プッシュすること
- 環境変数の変更後は再デプロイが必要
- 本番DBとローカルDBは同一（現時点）

---

## 関連リンク

- [Vercelダッシュボード](https://vercel.com/takashirokoichis-projects/kokoro-no-shirube)
- [GitHubリポジトリ](https://github.com/takashiro-koichi/kokoro-no-shirube)
- [Supabaseダッシュボード](https://supabase.com/dashboard)

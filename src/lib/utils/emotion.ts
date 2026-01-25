// 感情タグから絵文字への変換マップ
const EMOTION_EMOJI_MAP: Record<string, string> = {
  // ポジティブ
  喜び: '😊',
  嬉しい: '😊',
  楽しい: '😄',
  幸せ: '🥰',
  感謝: '🙏',
  期待: '🤩',
  充実: '✨',
  達成感: '🎉',
  安心: '😌',
  ワクワク: '😆',
  希望: '🌟',
  満足: '😊',
  愛: '💕',
  感動: '🥹',

  // ネガティブ
  悲しい: '😢',
  寂しい: '😔',
  怒り: '😠',
  イライラ: '😤',
  不安: '😰',
  心配: '😟',
  疲れ: '😫',
  疲労: '😫',
  ストレス: '😣',
  落ち込み: '😞',
  後悔: '😔',
  焦り: '😥',
  緊張: '😬',
  恐怖: '😨',
  退屈: '😐',

  // ニュートラル
  普通: '😐',
  平常: '😐',
  冷静: '🧐',
  思考: '🤔',
  驚き: '😲',
  複雑: '🫤',
};

// 感情タグから絵文字を取得
export function emotionTagToEmoji(tags: string[] | null): string | null {
  if (!tags || tags.length === 0) return null;

  // 各タグをチェックしてマッチする絵文字を探す
  for (const tag of tags) {
    // 完全一致
    if (EMOTION_EMOJI_MAP[tag]) {
      return EMOTION_EMOJI_MAP[tag];
    }

    // 部分一致
    for (const [keyword, emoji] of Object.entries(EMOTION_EMOJI_MAP)) {
      if (tag.includes(keyword)) {
        return emoji;
      }
    }
  }

  return null;
}

// 日記の表示用アイコンを取得
export function getDiaryIcon(emotionTags: string[] | null): string {
  const emoji = emotionTagToEmoji(emotionTags);
  return emoji || '●'; // 感情タグがない場合はドット
}

// すべての感情タグと絵文字のペアを取得（デバッグ用）
export function getAllEmotionEmojis(): Array<{ tag: string; emoji: string }> {
  return Object.entries(EMOTION_EMOJI_MAP).map(([tag, emoji]) => ({
    tag,
    emoji,
  }));
}

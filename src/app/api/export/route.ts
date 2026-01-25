import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// CSV用にエスケープ
function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 配列をCSV用に結合
function arrayToCSV(arr: string[] | null): string {
  if (!arr || arr.length === 0) return '';
  return arr.join('; ');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');

  if (!type || !['diary', 'dream', 'wishlist', 'all'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let csvContent = '';
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility

    if (type === 'diary' || type === 'all') {
      const { data: diaries, error } = await supabase
        .from('diaries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      if (type === 'diary') {
        csvContent = BOM + '日付,内容,要約,感情タグ,作成日時,更新日時\n';
        for (const diary of diaries || []) {
          csvContent += [
            escapeCSV(diary.date),
            escapeCSV(diary.content),
            escapeCSV(diary.summary),
            escapeCSV(arrayToCSV(diary.emotion_tags)),
            escapeCSV(diary.created_at),
            escapeCSV(diary.updated_at),
          ].join(',') + '\n';
        }

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="diaries_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }
    }

    if (type === 'dream' || type === 'all') {
      const { data: dreams, error } = await supabase
        .from('dreams')
        .select(`
          *,
          dream_keywords (keyword)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      if (type === 'dream') {
        csvContent = BOM + '日付,内容,キーワード,占い結果,作成日時,更新日時\n';
        for (const dream of dreams || []) {
          const keywords = dream.dream_keywords?.map((k: { keyword: string }) => k.keyword) || [];
          csvContent += [
            escapeCSV(dream.date),
            escapeCSV(dream.content),
            escapeCSV(arrayToCSV(keywords)),
            escapeCSV(dream.fortune_result),
            escapeCSV(dream.created_at),
            escapeCSV(dream.updated_at),
          ].join(',') + '\n';
        }

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="dreams_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }
    }

    if (type === 'wishlist' || type === 'all') {
      const { data: wishlists, error } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (type === 'wishlist') {
        csvContent = BOM + 'タイトル,説明,ステータス,期限,達成日,作成日時,更新日時\n';
        for (const wish of wishlists || []) {
          const statusLabel = wish.status === 'achieved' ? '達成済み' : wish.status === 'achievable' ? '達成可能' : '未達成';
          csvContent += [
            escapeCSV(wish.title),
            escapeCSV(wish.description),
            escapeCSV(statusLabel),
            escapeCSV(wish.deadline),
            escapeCSV(wish.achieved_at),
            escapeCSV(wish.created_at),
            escapeCSV(wish.updated_at),
          ].join(',') + '\n';
        }

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="wishlists_${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }
    }

    // type === 'all' の場合はZIPで返すべきだが、簡易的に日記のみを返す
    // 本来はJSZipなどを使用してZIPファイルを作成する
    return NextResponse.json({ error: 'All export not yet implemented. Please export individually.' }, { status: 501 });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

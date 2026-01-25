'use client';

import { useState } from 'react';
import { Download, FileText, Moon, Star, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type ExportType = 'diary' | 'dream' | 'wishlist';

interface ExportOption {
  type: ExportType;
  label: string;
  description: string;
  icon: typeof FileText;
}

const exportOptions: ExportOption[] = [
  {
    type: 'diary',
    label: '日記',
    description: '日付、内容、要約、感情タグ',
    icon: FileText,
  },
  {
    type: 'dream',
    label: '夢記録',
    description: '日付、内容、キーワード、占い結果',
    icon: Moon,
  },
  {
    type: 'wishlist',
    label: 'ウィッシュリスト',
    description: 'タイトル、説明、ステータス、期限',
    icon: Star,
  },
];

export default function ExportPage() {
  const [selected, setSelected] = useState<Set<ExportType>>(new Set());
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [completed, setCompleted] = useState<Set<ExportType>>(new Set());

  const toggleSelect = (type: ExportType) => {
    const newSelected = new Set(selected);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelected(newSelected);
  };

  const handleExport = async (type: ExportType) => {
    setExporting(type);
    try {
      const response = await fetch(`/api/export?type=${type}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setCompleted((prev) => new Set(prev).add(type));
    } catch (error) {
      console.error('Export error:', error);
      alert('エクスポートに失敗しました');
    } finally {
      setExporting(null);
    }
  };

  const handleExportSelected = async () => {
    for (const type of selected) {
      await handleExport(type);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">データエクスポート</h1>
        <p className="text-muted-foreground mt-1">
          記録をCSVファイルでダウンロードできます
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="w-5 h-5" />
            エクスポート対象
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportOptions.map((option) => (
            <div
              key={option.type}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={option.type}
                  checked={selected.has(option.type)}
                  onCheckedChange={() => toggleSelect(option.type)}
                />
                <Label
                  htmlFor={option.type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <option.icon className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(option.type)}
                disabled={exporting !== null}
              >
                {exporting === option.type ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : completed.has(option.type) ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button
              className="w-full"
              onClick={handleExportSelected}
              disabled={selected.size === 0 || exporting !== null}
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  エクスポート中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  選択した項目をエクスポート（{selected.size}件）
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        CSVファイルはExcelやスプレッドシートで開けます
      </p>
    </div>
  );
}

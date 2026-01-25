'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getUserProfile, updateUserProfile } from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserProfile } from '@/lib/supabase/types';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nickname: '',
    birthDate: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        const data = await getUserProfile(supabase, user.id);
        if (data) {
          setProfile(data);
          setFormData({
            nickname: data.nickname || '',
            birthDate: data.birth_date,
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('プロフィールの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) return;

    if (!formData.birthDate) {
      setError('生年月日を入力してください');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      await updateUserProfile(supabase, user.id, {
        nickname: formData.nickname || null,
        birth_date: formData.birthDate,
      });
      setSuccess(true);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">プロフィール</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="nickname">ニックネーム（任意）</Label>
          <Input
            id="nickname"
            type="text"
            placeholder="例: ゆめこ"
            value={formData.nickname}
            onChange={(e) =>
              setFormData({ ...formData, nickname: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">
            生年月日 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="birthDate"
            type="date"
            required
            value={formData.birthDate}
            onChange={(e) =>
              setFormData({ ...formData, birthDate: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            夢占いの精度向上のために使用されます。
          </p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {success && (
          <p className="text-green-600 text-sm">保存しました</p>
        )}

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </form>
    </div>
  );
}

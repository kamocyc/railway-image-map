import { NextResponse } from 'next/server';
import { processStationText } from '@/lib/gemini';
import { createClient } from '@/../utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'テキストが提供されていません' },
        { status: 400 }
      );
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return NextResponse.json(
        { error: 'ユーザーが認証されていません' },
        { status: 401 }
      );
    }

    async function isAdmin(userId: string | undefined) {
      if (!userId) return false;

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', userId)
          .single();

        return !error && data !== null;
      } catch (err) {
        console.error('Admin check failed:', err);
        return false;
      }
    }

    const isAdmin_ = await isAdmin(data.user.id)
    if (!isAdmin_) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const processedText = await processStationText(text);
    return NextResponse.json({ result: processedText });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'テキストの処理に失敗しました' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { processStationText } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'テキストが提供されていません' },
        { status: 400 }
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
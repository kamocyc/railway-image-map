// import 'server-only';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function processStationText(text: string): Promise<string> {
    try {
        const prompt = `再生時間（到着時間、発車時間の優先順位）と駅名をCSV形式で出力してください。駅名がローマ字の場合は日本語に変換してください。また、CSVのみを出力し、それ以外のテキストは出力しないでください。

入力例:
\`\`\`
0:00 オープニング
0:30 - 1:10 網走駅(A69) 始発
4:20 桂台駅(B79)
1:44:40 - 48:10 知床斜里
3:16:05 釧路 終着
\`\`\`

出力例:
\`\`\`csv
0:30,網走
4:20,桂台
1:44:40,知床斜里
3:16:05,釧路
\`\`\`

次のデータをCSVに変換してください。
\`\`\`
${text}
\`\`\``;

        const response = await genAI.models.generateContent({ model: 'gemini-2.5-flash-preview-05-20', contents: [prompt] });
        if (!response.text) {
            throw new Error('テキストの処理に失敗しました');
        }
        const processedText = response.text;

        // 余分な空白行を削除し、各行の前後の空白を削除
        return processedText
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0)
            .filter((line: string) => line.includes(','))   // CSV以外の行を削除
            .join('\n');
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('テキストの処理に失敗しました');
    }
} 
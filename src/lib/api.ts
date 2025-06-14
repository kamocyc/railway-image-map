export async function processStationText(text: string): Promise<string> {
    const response = await fetch('/api/process-station', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'テキストの処理に失敗しました');
    }

    const data = await response.json();
    return data.result;
} 
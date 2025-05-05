import { config } from 'dotenv';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fetchExhibitions } from './exhibitions.js';
import { sendExhibitions } from './line.js';

config();

interface SentHistory {
  exhibitions: {
    title: string;
    startDate: string;
    endDate: string;
  }[];
}

const HISTORY_FILE = 'sent_history.json';

const loadHistory = async (): Promise<SentHistory> => {
  try {
    const data = await readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { exhibitions: [] };
  }
};

const saveHistory = async (history: SentHistory): Promise<void> => {
  await writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
};

const isDuplicate = (exhibition: { title: string; startDate: string; endDate: string }, history: SentHistory): boolean => {
  return history.exhibitions.some(
    h => h.title === exhibition.title && h.startDate === exhibition.startDate && h.endDate === exhibition.endDate
  );
};

const main = async () => {
  try {
    // 展示情報の取得
    const exhibitions = await fetchExhibitions();
    if (exhibitions.length === 0) {
      console.log('No new exhibitions found');
      return;
    }

    // 履歴の読み込み
    const history = await loadHistory();

    // 重複除外
    const newExhibitions = exhibitions.filter(e => !isDuplicate(e, history));
    if (newExhibitions.length === 0) {
      console.log('No new exhibitions to send');
      return;
    }

    // LINE送信
    await sendExhibitions(newExhibitions);

    // 履歴の更新
    history.exhibitions.push(...newExhibitions.map(e => ({
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate
    })));
    await saveHistory(history);

    console.log(`Sent ${newExhibitions.length} new exhibitions`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main(); 
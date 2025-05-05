import axios from 'axios';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import 'dayjs/locale/ja.js';

dayjs.locale('ja');

export interface Exhibition {
  title: string;
  period: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  link: string;
  venue: string;
}

const pickLink = (links: string[]): string => {
  const priorityKeywords = ['ticket', '予約', '公式'];
  for (const keyword of priorityKeywords) {
    const link = links.find(l => l.toLowerCase().includes(keyword));
    if (link) return link;
  }
  return links[0] || '';
};

export const fetchExhibitions = async (): Promise<Exhibition[]> => {
  const url = process.env.TOKYO_EXHIB_URL;
  if (!url) throw new Error('TOKYO_EXHIB_URL is not set');

  console.log('Fetching exhibitions from:', url);
  
  // ヘッダーを追加してブラウザからのリクエストのように見せる
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  console.log('Response status:', response.status);

  const $ = cheerio.load(response.data);
  const exhibitions: Exhibition[] = [];

  // ベースURLを取得
  const baseUrl = new URL(url).origin;

  console.log('\nParsing exhibitions...');
  $('.wrap_exhibition').each((_: number, element: cheerio.Element) => {
    const $el = $(element);
    
    // タイトルとリンク
    const titleElement = $el.find('.exhibition_ttl .ttl');
    const title = titleElement.text().trim();
    const link = titleElement.attr('data-link') || '';

    // 会場
    const venueElement = $el.find('.exhibition_cnt .facility');
    const venue = venueElement.text().trim();

    // 会期
    const periodElement = $el.find('.exhibition_cnt p').filter((_, el) => {
      const text = $(el).text().trim();
      return text.includes('年') && text.includes('月') && text.includes('日');
    });
    const period = periodElement.text().trim();

    // 画像
    const imageElement = $el.find('.exhibition_img img');
    const relativeImageUrl = imageElement.attr('data-pagespeed-lazy-src') || imageElement.attr('src') || '';
    // pagespeedのパラメータを削除
    const cleanImageUrl = relativeImageUrl.replace(/\.pagespeed\.[^.]+\./, '.');
    const imageUrl = cleanImageUrl.startsWith('http') ? cleanImageUrl : `${baseUrl}${cleanImageUrl}`;

    console.log('\nFound exhibition:', title);
    console.log('Period:', period);
    console.log('Venue:', venue);
    console.log('Image URL:', imageUrl);
    console.log('Link:', link);

    if (!period) {
      console.log('Skipping: No period found');
      return;
    }

    // 日付の解析
    const [startDate, endDate] = period.split('～').map((d: string) => d.trim());
    console.log('Raw start date:', startDate);
    console.log('Raw end date:', endDate);

    // 日付文字列を整形
    const formatDate = (dateStr: string) => {
      const match = dateStr.match(/(\d+)年(\d+)月(\d+)日/);
      if (!match) return null;
      const [_, year, month, day] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    if (!formattedStartDate || !formattedEndDate) {
      console.log('Skipping: Invalid date format');
      console.log('Start date:', startDate);
      console.log('End date:', endDate);
      return;
    }

    const start = dayjs(formattedStartDate);
    const end = dayjs(formattedEndDate);

    if (!start.isValid() || !end.isValid()) {
      console.log('Skipping: Invalid date format');
      console.log('Formatted start date:', formattedStartDate);
      console.log('Formatted end date:', formattedEndDate);
      return;
    }

    console.log('Start date:', start.format('YYYY-MM-DD'));
    console.log('End date:', end.format('YYYY-MM-DD'));

    // 直近30日以内の展示のみ抽出
    const now = dayjs();
    if (end.isBefore(now)) {
      console.log('Exhibition has already ended');
      return;
    }

    exhibitions.push({
      title,
      period,
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      imageUrl,
      link,
      venue
    });
  });

  console.log('\nTotal exhibitions found:', exhibitions.length);
  return exhibitions;
}; 
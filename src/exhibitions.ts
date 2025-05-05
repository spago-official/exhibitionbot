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
  const response = await axios.get(url);
  console.log('Response status:', response.status);

  const $ = cheerio.load(response.data);
  const exhibitions: Exhibition[] = [];

  // HTMLの構造を確認
  console.log('\nChecking HTML structure...');
  const articleElements = $('article');
  console.log('Found article elements:', articleElements.length);

  console.log('Parsing exhibitions...');
  $('article').each((_: number, element: cheerio.Element) => {
    const $el = $(element);
    
    // タイトルとリンク
    const titleElement = $el.find('h3 a');
    const title = titleElement.text().trim();
    const link = titleElement.attr('href') || '';

    // 会期
    const periodElement = $el.find('.period');
    const period = periodElement.text().trim();

    // 画像
    const imageElement = $el.find('img');
    const imageUrl = imageElement.attr('src') || '';

    // 会場
    const venueElement = $el.find('.venue');
    const venue = venueElement.text().trim();

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
    const start = dayjs(startDate, 'YYYY.MM.DD');
    const end = dayjs(endDate, 'YYYY.MM.DD');

    if (!start.isValid() || !end.isValid()) {
      console.log('Skipping: Invalid date format');
      return;
    }

    console.log('Start date:', start.format('YYYY-MM-DD'));
    console.log('End date:', end.format('YYYY-MM-DD'));

    // 直近30日以内の展示のみ抽出
    const now = dayjs();
    if (end.isBefore(now) || start.isAfter(now.add(30, 'day'))) {
      console.log('Exhibition is outside the 30-day window');
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
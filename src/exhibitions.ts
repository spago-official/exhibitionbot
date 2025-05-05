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

  console.log('Parsing exhibitions...');
  $('.exhibition-item').each((_: number, element: cheerio.Element) => {
    const $el = $(element);
    const title = $el.find('.title').text().trim();
    const period = $el.find('.period').text().trim();
    const imageUrl = $el.find('img').attr('src') || '';
    const venue = $el.find('.venue').text().trim();

    console.log('\nFound exhibition:', title);
    console.log('Period:', period);

    // 日付の解析
    const [startDate, endDate] = period.split('～').map((d: string) => d.trim());
    const start = dayjs(startDate, 'YYYY.MM.DD');
    const end = dayjs(endDate, 'YYYY.MM.DD');

    console.log('Start date:', start.format('YYYY-MM-DD'));
    console.log('End date:', end.format('YYYY-MM-DD'));

    // 直近30日以内の展示のみ抽出
    const now = dayjs();
    if (end.isBefore(now) || start.isAfter(now.add(30, 'day'))) {
      console.log('Exhibition is outside the 30-day window');
      return;
    }

    // リンクの収集と優先順位付け
    const links: string[] = [];
    $el.find('a').each((_: number, a: cheerio.Element) => {
      const href = $(a).attr('href');
      if (href) links.push(href);
    });

    const selectedLink = pickLink(links);
    console.log('Selected link:', selectedLink);

    exhibitions.push({
      title,
      period,
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      imageUrl,
      link: selectedLink,
      venue
    });
  });

  console.log('\nTotal exhibitions found:', exhibitions.length);
  return exhibitions;
}; 
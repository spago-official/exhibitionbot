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
  console.log('Response headers:', response.headers);

  const $ = cheerio.load(response.data);
  const exhibitions: Exhibition[] = [];

  // HTMLの構造を詳細に分析
  console.log('\nAnalyzing HTML structure...');
  
  // ページ全体の構造を確認
  console.log('\nPage structure:');
  console.log('Title:', $('title').text());
  console.log('Body classes:', $('body').attr('class'));
  
  // メインコンテンツエリアを探す
  const mainContent = $('main, #main, .main, .content, #content, .container');
  console.log('\nMain content areas found:', mainContent.length);
  mainContent.each((i, el) => {
    console.log(`Main content ${i + 1} classes:`, $(el).attr('class'));
  });

  // すべてのdiv要素を確認
  console.log('\nAll div elements with classes:');
  $('div[class]').each((i, div) => {
    const classes = $(div).attr('class');
    if (classes && !classes.includes('search_event_inner')) {  // 検索フォームを除外
      console.log(`Div ${i + 1} classes:`, classes);
    }
  });

  // 展示情報を含む可能性のある要素を探す
  const possibleContainers = $('article, .article, .exhibition, .event, .item, .list_item, .exhibition_item, .event_item');
  console.log('\nPossible exhibition containers found:', possibleContainers.length);

  // 各コンテナの構造を確認
  possibleContainers.each((i, container) => {
    console.log(`\nContainer ${i + 1}:`);
    console.log('Classes:', $(container).attr('class'));
    console.log('HTML:', $(container).html()?.substring(0, 200) + '...');
    
    // タイトル要素を探す
    const titleElements = $(container).find('h1, h2, h3, h4, .title, .name, a');
    console.log('Title elements found:', titleElements.length);
    titleElements.each((j, el) => {
      const text = $(el).text().trim();
      if (text && text !== 'open calendar') {  // カレンダー関連のテキストを除外
        console.log(`Title ${j + 1}:`, text);
      }
    });

    // 日付要素を探す
    const dateElements = $(container).find('.date, .period, .schedule, time, .term, .event_date');
    console.log('Date elements found:', dateElements.length);
    dateElements.each((j, el) => {
      console.log(`Date ${j + 1}:`, $(el).text().trim());
    });
  });

  console.log('\nParsing exhibitions...');
  $('article, .article, .exhibition, .event, .item, .list_item, .exhibition_item, .event_item').each((_: number, element: cheerio.Element) => {
    const $el = $(element);
    
    // タイトルとリンク
    const titleElement = $el.find('h1 a, h2 a, h3 a, h4 a, .title a, .name a, a');
    const title = titleElement.text().trim();
    const link = titleElement.attr('href') || '';

    // 会期
    const periodElement = $el.find('.date, .period, .schedule, time, .term, .event_date');
    const period = periodElement.text().trim();

    // 画像
    const imageElement = $el.find('img');
    const imageUrl = imageElement.attr('src') || '';

    // 会場
    const venueElement = $el.find('.venue, .location, .place');
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
import { Client, FlexMessage } from '@line/bot-sdk';
import type { Exhibition } from './exhibitions.js';

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
});

const createExhibitionBubble = (exhibition: Exhibition) => ({
  type: 'bubble' as const,
  hero: {
    type: 'image' as const,
    url: exhibition.imageUrl,
    size: 'full' as const,
    aspectRatio: '20:13',
    aspectMode: 'cover' as const
  },
  body: {
    type: 'box' as const,
    layout: 'vertical' as const,
    contents: [
      {
        type: 'text' as const,
        text: exhibition.title,
        weight: 'bold' as const,
        size: 'xl' as const,
        wrap: true
      },
      {
        type: 'box' as const,
        layout: 'vertical' as const,
        margin: 'lg',
        spacing: 'sm',
        contents: [
          {
            type: 'box' as const,
            layout: 'baseline' as const,
            spacing: 'sm',
            contents: [
              {
                type: 'text' as const,
                text: '会期',
                color: '#aaaaaa',
                size: 'sm' as const,
                flex: 1
              },
              {
                type: 'text' as const,
                text: exhibition.period,
                wrap: true,
                color: '#666666',
                size: 'sm' as const,
                flex: 4
              }
            ]
          },
          {
            type: 'box' as const,
            layout: 'baseline' as const,
            spacing: 'sm',
            contents: [
              {
                type: 'text' as const,
                text: '会場',
                color: '#aaaaaa',
                size: 'sm' as const,
                flex: 1
              },
              {
                type: 'text' as const,
                text: exhibition.venue,
                wrap: true,
                color: '#666666',
                size: 'sm' as const,
                flex: 4
              }
            ]
          }
        ]
      }
    ]
  },
  footer: {
    type: 'box' as const,
    layout: 'vertical' as const,
    spacing: 'sm',
    contents: [
      {
        type: 'button' as const,
        style: 'link' as const,
        height: 'sm' as const,
        action: {
          type: 'uri' as const,
          label: '詳細を見る',
          uri: exhibition.link
        }
      }
    ],
    flex: 0
  }
});

export const sendExhibitions = async (exhibitions: Exhibition[]): Promise<void> => {
  const userId = process.env.LINE_USER_ID;
  if (!userId) throw new Error('LINE_USER_ID is not set');

  const maxItems = parseInt(process.env.MAX_ITEMS || '6', 10);
  const limitedExhibitions = exhibitions.slice(0, maxItems);

  const message: FlexMessage = {
    type: 'flex',
    altText: '美術展情報',
    contents: {
      type: 'carousel',
      contents: limitedExhibitions.map(createExhibitionBubble)
    }
  };

  await client.pushMessage(userId, message);
}; 
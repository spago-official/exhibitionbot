import { Client, FlexMessage, TextMessage, FlexBubble } from '@line/bot-sdk';
import { Exhibition } from './exhibitions.js';

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
});

const LINE_USER_ID = process.env.LINE_USER_ID;

export const sendExhibitions = async (exhibitions: Exhibition[]): Promise<void> => {
  if (!LINE_USER_ID) {
    throw new Error('LINE_USER_ID is not set');
  }

  for (const exhibition of exhibitions) {
    const message: FlexMessage = {
      type: 'flex',
      altText: `新しい展示会情報: ${exhibition.title}`,
      contents: createExhibitionBubble(exhibition)
    };

    await client.pushMessage(LINE_USER_ID, message);
  }
};

export const sendNoExhibitionsMessage = async (): Promise<void> => {
  if (!LINE_USER_ID) {
    throw new Error('LINE_USER_ID is not set');
  }

  const message: TextMessage = {
    type: 'text',
    text: '現在、新しい展示会情報はありません。\n次回の更新をお待ちください。'
  };

  await client.pushMessage(LINE_USER_ID, message);
};

const createExhibitionBubble = (exhibition: Exhibition): FlexBubble => {
  return {
    type: 'bubble',
    hero: {
      type: 'image',
      url: exhibition.imageUrl,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: exhibition.title,
          weight: 'bold',
          size: 'xl',
          wrap: true
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '会場',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 1
                },
                {
                  type: 'text',
                  text: exhibition.venue,
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5
                }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '会期',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 1
                },
                {
                  type: 'text',
                  text: exhibition.period,
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5
                }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'link',
          height: 'sm',
          action: {
            type: 'uri',
            label: '詳細を見る',
            uri: exhibition.link
          }
        }
      ],
      flex: 0
    }
  };
}; 
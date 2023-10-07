import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { postToSlack, queryOpenAI } from './lib';
import { scrapeRssFeed, getCurrentDayDishes } from './rssScraper';

import * as dotenv from 'dotenv';
dotenv.config();

async function huomenta(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    return { body: 'Huomenta päiviä näläkä olis!' };
};

export async function helloLunchChannel(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  return await helloLunchChannelInternal();
}

export async function helloLunchChannelInternal() {
  const slackUrl = process.env.SlackWebHookURL || '';
  const restaurantUrl = process.env.RestaurantMenuURL || '';
  const openAiUrl = process.env.OPENAI_API_URL || ''
  if (!slackUrl || !restaurantUrl || !openAiUrl) {
    return { body: 'Slack webhook, OpenAI or restaurant URL not set!' };
  }
  const scrapedMenuData: any = await scrapeRssFeed(restaurantUrl);
  const currentDayDishes = getCurrentDayDishes(scrapedMenuData);

  const prompt = 'Kuvaile nämä ruokalajit lyhyesti ja suosittele minulle yhtä niistä. ' + currentDayDishes;

  const completion = await queryOpenAI(openAiUrl, prompt);

  await postToSlack(slackUrl, currentDayDishes, completion);
  return { body: 'Slakkiä spämmätty!' };
}

app.http('lounas', {
    methods: ['GET', 'POST'],
    handler: huomenta
});

app.http('slack', {
  methods: ['GET', 'POST'],
  handler: helloLunchChannel
});
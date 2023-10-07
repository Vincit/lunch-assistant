import { app, HttpRequest, HttpResponseInit, InvocationContext, Timer } from '@azure/functions';
import { postToSlack, queryOpenAI } from './lib';
import { scrapeRssFeed, getCurrentDayDishes } from './rssScraper';

import * as dotenv from 'dotenv';
dotenv.config();

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

  const prompt = 'Kuvaile alla olevat ruokalajit lyhyesti ja suosittele minulle yhtä niistä. ' + currentDayDishes;
  const completion = await queryOpenAI(openAiUrl, prompt);

  postToSlack(slackUrl, currentDayDishes, completion);
  return { body: 'Slakkiä spämmätty!' };
}

export async function timerTrigger1(myTimer: Timer, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Timer function processed request.');
  return await helloLunchChannelInternal();
}

// app.timer('timerTrigger1', {
//   schedule: '0 */1 * * * *',
//   handler: timerTrigger1,
// });

app.http('slack', {
  methods: ['GET', 'POST'],
  handler: helloLunchChannel
});
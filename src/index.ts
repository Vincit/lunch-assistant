import { app, HttpRequest, HttpResponseInit, InvocationContext, Timer } from '@azure/functions';
import { postToSlack, queryOpenAI } from './lib';
import { scrapeRssFeed, getCurrentDayDishes } from './rssScraper';

import * as dotenv from 'dotenv';
dotenv.config();

export async function helloLunchChannel(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  return await helloLunchChannelInternal();
}

export async function helloLunchChannelInternal() {
  // Check if we should run based on Finnish time
  const now = new Date();
  const finnishTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }));
  const targetHour = 10;
  const targetMinute = 30;

  if (finnishTime.getHours() !== targetHour || finnishTime.getMinutes() !== targetMinute) {
    return { body: 'Not the correct Finnish time to run' };
  }

  const slackUrl = process.env.SlackWebHookURL || '';
  const restaurantUrl = process.env.RestaurantMenuURL || '';
  const openAiUrl = process.env.OPENAI_API_URL || ''
  if (!slackUrl || !restaurantUrl || !openAiUrl) {
    return { body: 'Slack webhook, OpenAI or restaurant URL not set!' };
  }
  const scrapedMenuData: any = await scrapeRssFeed(restaurantUrl);
  const currentDayDishes = getCurrentDayDishes(scrapedMenuData);

  const prompt = 
    `Kuvaile näitä ruokalajeja lyhyesti mutta hauskasti ja anna suositus mitä syödä. Lisää viestiin ruokalajia kuvaava emoji. ${currentDayDishes} Tähän loppuun hauskasti sanottuna pyyntö reagoida emojilla, jos olet tulossa mukaan syömään!`;
  const completion = await queryOpenAI(openAiUrl, prompt);

  postToSlack(slackUrl, currentDayDishes, completion);
  return { body: 'Slakkiä spämmätty!' };
}

export async function timerTrigger1(myTimer: Timer, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Timer function processed request.');
  return await helloLunchChannelInternal();
}

// Schedule to run at both 7:30 UTC and 8:30 UTC on weekdays to catch 10:30 Finnish time in both DST and non-DST periods
app.timer('timerTrigger1', {
  schedule: '0 30 7,8 * * 1-5',
  handler: timerTrigger1,
});

app.http('slack', {
  methods: ['GET', 'POST'],
  handler: helloLunchChannel
});
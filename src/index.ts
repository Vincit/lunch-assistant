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

  const prompt = 
    `Kuvaile näitä ruokalajeja lyhyesti mutta hauskasti ja anna suositus mitä syödä. Lisää viestiin ruokalajia kuvaava emoji. ${currentDayDishes} Tähän loppuun hauskasti sanottuna pyyntö reagoida emojilla, jos olet tulossa mukaan syömään!`;
  const completion = await queryOpenAI(openAiUrl, prompt, currentDayDishes);

  postToSlack(slackUrl, currentDayDishes, completion);
  return { body: 'Slakkiä spämmätty!' };
}

export async function timerTrigger1(myTimer: Timer, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Timer function processed request.');
  return await helloLunchChannelInternal();
}

// Scheduling for 10:30 AM on weekdays, but cloud functions are UTC 
// so 7:30 AM for Finnish summertime and 8:30 AM for Finnish wintertime
app.timer('timerTrigger1', {
  schedule: '0 30 8 * * 1-5',
  handler: timerTrigger1,
});

app.http('slack', {
  methods: ['GET', 'POST'],
  handler: helloLunchChannel
});
import { app, HttpRequest, HttpResponseInit, InvocationContext, Timer } from '@azure/functions';
import { postToSlack, queryOpenAI } from './lib';
import { scrapeRssFeed, getCurrentDayDishes } from './rssScraper';

import * as dotenv from 'dotenv';
dotenv.config();

export async function helloLunchChannel(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const triggerKey = process.env.TRIGGER_KEY;
  const providedTriggerKey = request.query.get('key') || request.headers.get('x-trigger-key');

  if (triggerKey && providedTriggerKey !== triggerKey) {
    context.log('Rejected lunch trigger request due to missing or invalid trigger key.');
    return { status: 401, body: 'Unauthorized' };
  }

  const bypass = request.query.get('bypass') === 'true';
  return await helloLunchChannelInternal(bypass);
}

export async function helloLunchChannelInternal(bypassTimeCheck = false) {
  // Check if we should run based on Finnish time
  const now = new Date();
  const finnishTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }));
  const targetHour = 10;
  const targetMinute = 30;

  if (!bypassTimeCheck && (finnishTime.getHours() !== targetHour || finnishTime.getMinutes() !== targetMinute)) {
    return { body: 'Not the correct Finnish time to run' };
  }

  const slackUrl = process.env.SlackWebHookURL || '';
  const restaurantUrl = process.env.RestaurantMenuURL || '';
  const openAiUrl = process.env.OPENAI_API_URL || ''
  const hasSdkOpenAiConfig = Boolean(
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_ENDPOINT &&
    process.env.OPENAI_DEPLOYMENT,
  );

  if (!slackUrl || !restaurantUrl || (!openAiUrl && !hasSdkOpenAiConfig)) {
    return { body: 'Slack webhook, restaurant URL, or OpenAI configuration not set!' };
  }
  const scrapedMenuData: any = await scrapeRssFeed(restaurantUrl);
  const currentDayDishes = getCurrentDayDishes(scrapedMenuData);

  const prompt = 
    `Olet nokkela ja huumorintajuinen lounasreportteri, jonka kirjoitustyyli on brittiläisen tabloidilehden etusivun kaltainen: napakan, liioittelevan, oivaltavan ja vitsikkään kohuotsikoinnin sävyinen. Tehtäväsi: 1. Kuvaile jokainen alla oleva ruokalaji (eriteltynä, jos useampi) lyhyesti (max. 1 lause, älä käytä markdown-syntaksia) käyttäen tätä tabloidityyliä. Älä vain kuvaile ainesosia, vaan luo dramaattinen/hauska mielikuva ruoasta. 2. Lisää kuvauslauseen alkuun tai loppuun ruokalajia kuvaava emoji. 3. Anna lopuksi "päivän pääuutisena" hauska ja naseva suositus siitä, mitä syödä. 4. Lisää loppuun hauskasti sanottuna, tabloidityyliin ytimekäs pyyntö reagoida emojilla, jos on tulossa mukaan syömään. Ruokalistalla tänään: ${currentDayDishes} HUOM: Jos ravintola on kiinni tai lista on tyhjä, älä keksi ruokalajeja. Ilmoita silloin ytimekkäästi, että "lounas on peruttu skandaalin vuoksi" tms. Lopuksi, jos tänään on joku suomalaisen kalenterin mukainen liputus- tai muu juhlapäivä, niin kerro siitä ko. juhlan teeman mukaisesti. Jos ei, niin anna joku tsemppilause arkiseen työpäivään.`;
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

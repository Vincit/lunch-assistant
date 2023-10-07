import axios, { AxiosResponse } from 'axios';
import { scrapeRssFeed } from './rssScraper'

export const postToSlack = async (slackUrl: string, menuUrl: string): Promise<void> => {
  const scrapedMenuData: any = await scrapeRssFeed(menuUrl);
  const dayIndex = Math.min(new Date().getDay() - 1, 4);

  const daysOfWeek = [
    "Sunnuntai",
    "Maanantai",
    "Tiistai",
    "Keskiviikko",
    "Torstai",
    "Perjantai",
    "Lauantai",
  ];

  const currentDayDishes = scrapedMenuData[dayIndex].dishes.reduce((cur: string, agg: string) => agg += cur + '\n', '');
  const currentDay = daysOfWeek[dayIndex + 1];
  try {
    const payload = {
      text: `Lounasta päivälle ${currentDay}:\n${currentDayDishes}`
    };
    const headers = {
      "Content-Type": "application/json",
    };

    console.log('Sending Slack message... POST request to: ' + slackUrl);
    const response: AxiosResponse = await axios.post(slackUrl, payload, { headers });
    console.log(response.status);
  } catch (error: any) {
    console.log('Error in Slack integration!');
    console.log(error.message);
  }
};
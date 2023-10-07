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

export const queryOpenAI = async (url: string, prompt: string): Promise<string> => {
  try {
    const payload = {
      "messages": [{
        "role": "user",
        "content": prompt
      }],
      "temperature": 0.7,
      "top_p": 0.95,
      "frequency_penalty": 0,
      "presence_penalty": 0,
      "max_tokens": 800,
      "stop": null
    };
    const headers = {
      "Content-Type": "application/json",
      "api-key": process.env.OPENAI_API_KEY,
    };

    console.log('Sending OpenAI request... POST request to: ' + url);
    const response: AxiosResponse = await axios.post(url, payload, { headers });
    console.log(response.status);
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.log('Error in OpenAI integration!');
    console.log(error.message);
    return '';
  }
}
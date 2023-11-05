import axios, { AxiosResponse } from 'axios';
import cheerio from 'cheerio'
const he = require('he');

export const postToSlack = async (slackUrl: string, headline: string, message: string): Promise<void> => {
  try {
    const payload = {
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `\`\`\`${headline}\`\`\``
          }
        },
        {
          "type": "section",
          "text": {
            "type": "plain_text",
            "text": message
          }
        }
      ]
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

export const queryOpenAI = async (url: string, prompt: string, rawData: string): Promise<string> => {
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
    return 'Valitettavasti Azure OpenAI ei vastaa, mutta tässä lounaslista sellaisenaan: ' + rawData;
  }
}

/**
 * Get menu for current week as text.
 */
export const getWeekMenu = async (): Promise<string> => {
  const date = getCurrentWeekMonday()
  const url = 'https://www.compass-group.fi/menuapi/week-menus?costCenter=3024&date='+date+'T09%3A18%3A46.441Z&language=fi';
  const response = await queryOrigo(url)

  return response.data.menus.map((dayMenu: any) => {
    return dayMenu.dayOfWeek + "\n" + htmlToText(dayMenu.html)
  }).join("\n")
}

export const getDayMenu = async (date: string): Promise<string> => {
  const url = 'https://www.compass-group.fi/menuapi/day-menus?costCenter=3024&date='+date+'T09%3A18%3A46.441Z&language=fi';
  const response = await queryOrigo(url)
  return htmlToText(response.data.html)
}

const queryOrigo = async (url: string): Promise<any> => {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    console.log('Getting lunch data... GET request to: ' + url);
    const response: AxiosResponse = await axios.get(url, { headers });
    return response;
  } catch (error: any) {
    console.log('Error in lunch scraping!');
    console.log(error.message);
    return 'error';
  }
}

const getCurrentWeekMonday = (): string => {
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const daysUntilMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysUntilMonday);

  const isoFormattedMonday = monday.toISOString().split('T')[0];

  return isoFormattedMonday;
}

const htmlToText = (html: string): string => {
  try {
    const parts = html.split('\n');
    const cleanedParts = parts
      .filter(val => val !== '<p>&nbsp;</p>')
      .map((part) => {
        const $ = cheerio.load(part);
        const text = $.text();
        const decodedText = he.decode(text);
        return decodedText;
      })

    return cleanedParts.join("\n");
  } catch (error: any) {
    return 'UIINA'
  }
}

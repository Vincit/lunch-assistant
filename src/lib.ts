import axios, { AxiosResponse } from 'axios';
import { AzureOpenAI } from 'openai';
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

export const queryOpenAI = async (url: string, prompt: string): Promise<string> => {
  try {
    const sdkEndpoint = process.env.OPENAI_ENDPOINT;
    const sdkDeployment = process.env.OPENAI_DEPLOYMENT;
    const sdkApiVersion = process.env.OPENAI_API_VERSION || '2025-03-01-preview';
    const sdkApiKey = process.env.OPENAI_API_KEY;

    if (sdkEndpoint && sdkDeployment && sdkApiKey) {
      console.log('Sending OpenAI request with AzureOpenAI SDK... endpoint: ' + sdkEndpoint + ', deployment: ' + sdkDeployment);

      const client = new AzureOpenAI({
        endpoint: sdkEndpoint,
        deployment: sdkDeployment,
        apiVersion: sdkApiVersion,
        apiKey: sdkApiKey,
      });

      const sdkResponse = await client.responses.create({
        model: sdkDeployment,
        input: prompt,
      });

      const sdkOutputText =
        sdkResponse.output_text ||
        sdkResponse.output
          ?.flatMap((item: any) => item?.content || [])
          .map((part: any) => part?.text || part?.value || '')
          .find((text: string) => typeof text === 'string' && text.trim().length > 0);

      if (typeof sdkOutputText === 'string' && sdkOutputText.trim().length > 0) {
        return sdkOutputText;
      }

      console.log('OpenAI SDK returned 200 but no text in known response fields.');
      console.log(JSON.stringify(sdkResponse, null, 2));
      return 'OpenAI vastasi, mutta tekstisisaltoa ei loytynyt vastauksesta.';
    }

    const isResponsesApi = /\/responses(\?|$)/.test(url);
    const payload = isResponsesApi
      ? {
          ...(process.env.OPENAI_MODEL ? { model: process.env.OPENAI_MODEL } : {}),
          input: prompt,
          stream: false,
        }
      : {
          messages: [{
            role: 'user',
            content: prompt,
          }],
          temperature: 0.7,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
          max_completion_tokens: 800,
        };
    const headers = {
      "Content-Type": "application/json",
      "api-key": process.env.OPENAI_API_KEY,
    };

    console.log('OpenAI SDK settings missing, falling back to direct URL mode.');
    console.log('Sending OpenAI request... POST request to: ' + url);
    const response: AxiosResponse = await axios.post(url, payload, { headers });
    console.log(response.status);

    const outputText =
      response.data?.output_text ||
      response.data?.output?.flatMap((item: any) => item?.content || [])
        .map((part: any) => part?.text || part?.value || '')
        .find((text: string) => typeof text === 'string' && text.trim().length > 0) ||
      response.data?.choices?.[0]?.message?.content;

    if (typeof outputText === 'string' && outputText.trim().length > 0) {
      return outputText;
    }

    console.log('OpenAI returned 200 but no text in known response fields.');
    console.log(JSON.stringify(response.data, null, 2));
    return 'OpenAI vastasi, mutta tekstisisaltoa ei loytynyt vastauksesta.';
  } catch (error: any) {
    console.log('Error in OpenAI integration!');
    if (axios.isAxiosError(error)) {
      console.log('OpenAI request failed with AxiosError.');
      console.log('Request URL: ' + url);
      console.log('HTTP status: ' + (error.response?.status ?? 'unknown'));
      console.log('Status text: ' + (error.response?.statusText ?? 'unknown'));

      const requestId =
        error.response?.headers?.['x-request-id'] ||
        error.response?.headers?.['apim-request-id'] ||
        error.response?.headers?.['x-ms-request-id'] ||
        'unknown';

      console.log('Azure request id: ' + requestId);

      if (error.response?.data) {
        console.log('OpenAI error response body:');
        console.log(JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('No response body was returned by OpenAI.');
      }
    } else {
      console.log(error);
    }
    return 'Valitettavasti Azure OpenAI ei vastaa, mutta tässä lounaslista sellaisenaan.';
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

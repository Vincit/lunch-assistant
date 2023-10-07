import axios, { AxiosResponse } from 'axios';

export const postToSlack = async (url: string, text: string): Promise<void> => {
  try {
    const payload = {
      text,
    };
    const headers = {
      "Content-Type": "application/json",
    };

    console.log('Sending Slack message... POST request to: ' + url);
    const response: AxiosResponse = await axios.post(url, payload, { headers });
    console.log(response.status);
  } catch (error: any) {
    console.log('Error in Slack integration!');
    console.log(error.message);
  }
};
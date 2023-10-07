import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { postToSlack } from './lib';

import * as dotenv from 'dotenv';
dotenv.config();

async function huomenta(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    return { body: 'Huomenta päiviä näläkä olis!' };
};

export async function helloLunchChannel(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const url = process.env.SlackWebHookURL || '';
  const menuuri = process.env.RestaurantMenuURL || '';
  if (!url) {
    return { body: 'Slack webhook URL not set!' };
  }
  postToSlack(url, menuuri);
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
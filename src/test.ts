import { postToSlack } from './lib';
import * as dotenv from 'dotenv';

console.log('Starting testing ...');
dotenv.config();

const slackuri = process.env.SlackWebHookURL || '';
const menuuri = process.env.RestaurantMenuURL || '';

if (!slackuri) {
  console.log('Slack webhook URL not set!');
  process.exit(1);
}
if (!menuuri) {
  console.log('Menu URL not set!');
  process.exit(1);
}
postToSlack(
  slackuri,
  menuuri
);
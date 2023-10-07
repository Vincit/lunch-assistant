import { postToSlack } from './lib';
import * as dotenv from 'dotenv';

console.log('Starting testing ...');
dotenv.config();

const uri = process.env.SlackWebHookURL || '';
if (!uri) {
  console.log('Slack webhook URL not set!');
  process.exit(1);
}
postToSlack(
  uri,
  'Huomenta päiviä Azuresta näläkä olis!'
);
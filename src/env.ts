import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';

if (
  process.env.MAGISK_BOT_TOKEN === undefined ||
  process.env.MAGISK_OWNER_TOKEN === undefined ||
  process.env.MAGISK_BOT_DOMAIN === undefined ||
  process.env.MAGISK_WEBHOOK_SECRET === undefined ||
  process.env.PORT === undefined
) {
  throw Error('Error: Please setup environment variables');
}

export const ghBot = new Octokit({
  auth: process.env.MAGISK_BOT_TOKEN,
  request: { fetch },
});

export const ghOwner = new Octokit({
  auth: process.env.MAGISK_OWNER_TOKEN,
  request: { fetch },
});

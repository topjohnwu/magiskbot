import { Octokit } from '@octokit/rest';

if (
  process.env.MAGISK_BOT_TOKEN === undefined ||
  process.env.MAGISK_OWNER_TOKEN === undefined ||
  process.env.MAGISK_BOT_DOMAIN === undefined ||
  process.env.MAGISK_WEBHOOK_SECRET === undefined ||
  process.env.PORT === undefined
) {
  throw Error('Error: Please setup environment variables');
}

const ghBot = new Octokit({
  auth: process.env.MAGISK_BOT_TOKEN,
});

const ghOwner = new Octokit({
  auth: process.env.MAGISK_OWNER_TOKEN,
});

export { ghBot, ghOwner };

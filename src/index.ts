import fetch from 'node-fetch';
import countDownloads from './count.js';
import { blockAllSpam } from './utils.js';
import server from './webhook.js';

async function main() {
  // Scan and block all spam every 8 hours
  await blockAllSpam();
  setInterval(blockAllSpam, 8 * 60 * 60 * 1000);

  // Update download counts every hour
  setInterval(countDownloads, 60 * 60 * 1000);

  // Wake Heroku every 15 mins
  setInterval(async () => {
    await fetch(`${process.env.MAGISK_BOT_DOMAIN}/ping`);
  }, 15 * 60 * 1000);

  // Start webhook server
  try {
    await server.listen(Number(process.env.PORT), '0.0.0.0');
    console.log(`Server listening to ${process.env.PORT}`);
  } catch (err) {
    console.log(err);
  }
}

main();

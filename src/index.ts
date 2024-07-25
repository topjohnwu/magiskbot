import { blockAllSpam } from './utils.js';
import server from './webhook.js';
import countDownloads from './count.js';

async function main() {
  // Scan and block all spam every 8 hours
  await blockAllSpam();
  setInterval(blockAllSpam, 8 * 60 * 60 * 1000);

  // Count downloads every 24 hours
  await countDownloads();
  setInterval(countDownloads, 24 * 60 * 60 * 1000);

  // Start webhook server
  try {
    await server.listen({ port: Number(process.env.PORT), host: '0.0.0.0' });
    console.log(`Server listening to ${process.env.PORT}`);
  } catch (err) {
    console.log(err);
  }
}

main();

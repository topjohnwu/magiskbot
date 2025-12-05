/* eslint-disable @typescript-eslint/no-misused-promises */
import server from './webhook.js';
import updateCountJson from './count.js';

async function main() {
  // Start webhook server
  try {
    await server.listen({ port: Number(process.env.PORT), host: '0.0.0.0' });
    console.log(`Server listening to ${process.env.PORT}`);
  } catch (err) {
    console.log(err);
  }

  // Count downloads every 24 hours
  setInterval(updateCountJson, 24 * 60 * 60 * 1000);
}

await main();

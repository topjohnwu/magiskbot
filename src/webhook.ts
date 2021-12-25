import Fastify from 'fastify';
import { EmitterWebhookEventName, Webhooks } from '@octokit/webhooks';
import { blockUser, closeIssue, closePR } from './utils.js';

const webhook = new Webhooks({
  secret: process.env.MAGISK_WEBHOOK_SECRET!,
});

webhook.on('issues', async ({ payload }) => {
  const { issue } = payload;
  if (issue.labels?.some((l) => l.name === 'spam')) {
    await blockUser(issue.user.login);
    if (issue.state !== 'closed') {
      await closeIssue(issue);
    }
  }
});

webhook.on('pull_request', async ({ payload }) => {
  const pr = payload.pull_request;
  if (pr.labels.some((l) => l.name === 'spam')) {
    await blockUser(pr.user.login);
    if (pr.state !== 'closed') {
      await closePR(pr);
    }
  }
});

const server = Fastify();

server.post('/webhook', async (req, res) => {
  await webhook.verifyAndReceive({
    id: req.headers['x-github-delivery'] as string,
    name: req.headers['x-github-event'] as EmitterWebhookEventName,
    payload: req.body as any,
    signature: req.headers['x-hub-signature-256'] as string,
  });
  res.send();
});

server.post('/ping', (_, res) => {
  res.send();
});

export default server;

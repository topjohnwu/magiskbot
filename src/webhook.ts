import Fastify from 'fastify';
import { Webhooks } from '@octokit/webhooks';
import {
  WebhookEventName,
  IssuesEvent,
  PullRequestEvent,
} from '@octokit/webhooks-types';
import { purgeOutdatedCache } from './cache.js';
import {
  blockUser,
  closeIssue,
  closePR,
  commentIssue,
  getVersionCode,
  lockSpamIssue,
  lockSpamPR,
  rerunAction,
} from './utils.js';

const webhook = new Webhooks({
  secret: process.env.MAGISK_WEBHOOK_SECRET!,
});

webhook.on('issues', async ({ payload }) => {
  const { issue } = payload as IssuesEvent;
  const repo = {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
  };
  if (issue.labels?.some((l) => l.name === 'spam')) {
    await blockUser(issue.user.login);
    if (issue.state !== 'closed') {
      await Promise.all([
        closeIssue(repo, issue),
        lockSpamIssue(repo, issue)
      ]);
    }
    return;
  }
  if (payload.action === 'opened') {
    const versionCodeLine = issue.body
      ?.split('\n')
      .filter((s) => s.startsWith('Magisk version code:'))
      .at(-1);

    const ver = await getVersionCode();
    if (!versionCodeLine?.includes(ver)) {
      const msg =
        'Invalid bug report, automatically closed.\n' +
        `Please report issues using the latest debug Magisk build (version code: ${ver}).`;
      await Promise.all([
        commentIssue(repo, issue, msg),
        closeIssue(repo, issue),
      ]);
    }
  }
});

webhook.on('pull_request', async ({ payload }) => {
  const { pull_request: pr } = payload as PullRequestEvent;
  if (pr.labels.some((l) => l.name === 'spam')) {
    await blockUser(pr.user.login);
    if (pr.state !== 'closed') {
      const repo = {
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
      };
      await Promise.all([
        closePR(repo, pr),
        lockSpamPR(repo, pr)
      ]);
    }
  }
});

webhook.on('workflow_run', async ({ payload }) => {
  if (payload.action === 'completed') {
    await purgeOutdatedCache();
    if (payload.workflow_run.conclusion == 'failure' && payload.workflow_run.run_attempt < 3) {
      // Automatically retry on failure, at most 3 times
      const repo = {
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
      };
      await rerunAction(repo, payload.workflow_run.id)
    }
  }
});

const server = Fastify();

server.post('/webhook', async (req, res) => {
  await webhook.verifyAndReceive({
    id: req.headers['x-github-delivery'] as string,
    name: req.headers['x-github-event'] as WebhookEventName,
    payload: JSON.stringify(req.body),
    signature: req.headers['x-hub-signature-256'] as string,
  });
  res.send();
});

server.get('/ping', (_, res) => {
  res.send();
});

export default server;

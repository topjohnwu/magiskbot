import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import crypto from 'crypto';
import bufferEq from 'buffer-equal-constant-time';

import Submission from './Submission';
import MagiskRepo from './MagiskRepo';
import countDownloads from './count';

const server = express();
server.use(bodyParser.json({
  verify: (req, res, buf) => {
    if (req.get('User-Agent').startsWith('GitHub-Hookshot/')) {
      const hash = crypto.createHmac('sha1', process.env.MAGISK_WEBHOOK_SECRET).update(buf).digest('hex');
      if (!bufferEq(Buffer.from(req.get('X-Hub-Signature')), Buffer.from(`sha1=${hash}`))) {
        res.status(400).send('hash mismatch');
      }
    }
  },
}));

const actionFilter = ['opened', 'reopened', 'edited', 'labeled'];
server.post('/submit', (req, res) => {
  const payload = req.body;
  if (actionFilter.includes(payload.action) && payload.issue.state === 'open') {
    Submission.handleRequest(payload.issue);
  }
  res.send();
});

server.post('/moderate', async (req, res) => {
  res.send();
  const event = req.get('X-GitHub-Event');
  if (event === 'push') {
    // Skip submission repo
    if (req.body.repository.name === 'submission') {
      return;
    }
    console.log(`[PUSH EVENT] ${req.body.repository.name}`);
    await MagiskRepo.refreshModule(req.body.repository);
  } else if (event === 'repository') {
    console.log(`[REPO EVENT] ${req.body.repository.name}: ${req.body.action}`);
    await MagiskRepo.handleRepoEvent(req.body);
  }
  MagiskRepo.publishModulesJSON();
});

server.get('/ping', (_, res) => res.send());

async function start() {
  await MagiskRepo.loadModules();
  Submission.clearRequests();
  MagiskRepo.publishModulesJSON();
}

// Full restart every 8 hours
setInterval(start, 8 * 60 * 60 * 1000);

// Wake Heroku every 15 mins
setInterval(() => axios.get(`${process.env.MAGISK_SERVER_DOMAIN}/ping`), 15 * 60 * 1000);

// Update download counts every hour
countDownloads();
setInterval(countDownloads, 60 * 60 * 1000);

// Start things up
start();

export default server;

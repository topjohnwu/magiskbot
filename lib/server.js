import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import crypto from 'crypto';
import bufferEq from 'buffer-equal-constant-time';

import Submission from './Submission';
import MagiskRepo from './MagiskRepo';

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

server.post('/moderate', (req, res) => {
  const event = req.get('X-GitHub-Event');
  if (event === 'push') {
    console.log(`[PUSH EVENT] ${req.body.repository.name}`);
    MagiskRepo.checkRepo(req.body.repository);
  } else if (event === 'repository') {
    console.log(`[REPO EVENT] ${req.body.repository.name}: ${req.body.action}`);
  }
  res.send();
});

server.get('/ping', (req, res) => res.send());

MagiskRepo.moderate();
Submission.clearRequests();

// Wake Heroku every 15 mins
setInterval(() => axios.get(`${process.env.MAGISK_SERVER_DOMAIN}/ping`), 15 * 60 * 1000);

// Run full scan periodically
setInterval(() => {
  MagiskRepo.moderate();
  Submission.clearRequests();
}, 8 * 60 * 60 * 1000);

export default server;

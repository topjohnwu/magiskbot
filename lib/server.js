import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import crypto from 'crypto';
import bufferEq from 'buffer-equal-constant-time';

import SubmissionHandler from './SubmissionHandler';
import RepoSanitizer from './RepoSanitizer';

const server = express();
server.use(bodyParser.json({
  verify: (req, res, buf, encoding) => {
    if (req.get('User-Agent').startsWith('GitHub-Hookshot/')) {
      let hash = crypto.createHmac('sha1', process.env.MAGISK_WEBHOOK_SECRET).update(buf).digest('hex');
      if (!bufferEq(Buffer.from(req.get('X-Hub-Signature')), Buffer.from('sha1=' + hash)))
        res.status(400).send('hash mismatch');
    }
  }
}));

const actionFilter = ['opened', 'reopened', 'edited', 'labeled'];
server.post('/submit', (req, res) => {
  let payload = req.body;
  if (actionFilter.includes(payload.action) && payload.issue.state === 'open')
    SubmissionHandler(payload.issue);
  res.send();
});

server.post('/moderate', (req, res) => {
  let event = req.get('X-GitHub-Event');
  if (event === 'push') {
    console.log(`[PUSH EVENT] ${req.body.repository.name}`);
    RepoSanitizer(req.body.repository);
  } else if (event === 'repository') {
    console.log(`[REPO EVENT] ${req.body.repository.name}: ${req.body.action}`);
  }
  res.send();
});

server.get('/ping', (req, res) => res.send());

// Wake Heroku every 15 mins
setInterval(() => axios.get(`${process.env.MAGISK_SERVER_DOMAIN}/ping`), 15 * 60 * 1000);

export default server;

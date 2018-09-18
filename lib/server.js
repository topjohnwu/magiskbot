import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import crypto from 'crypto';
import bufferEq from 'buffer-equal-constant-time';

import { ID_SET } from './Shared';
import SubmissionHandler from './SubmissionHandler';
import RepoModerator from './RepoModerator';

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

const subActions = ['opened', 'reopened', 'edited'];
server.post('/submit', (req, res) => {
  let event = req.body;
  if (subActions.includes(event.action) && event.issue.state === 'open')
    SubmissionHandler(event.issue);
  res.send();
});

server.post('/moderate', (req, res) => {
  let event = req.get('X-GitHub-Event');
  if (event === 'push') {
    console.log(`[PUSH EVENT] ${req.body.repository.name}`);
    RepoModerator(req.body.repository);
  } else if (event === 'repository') {
    console.log(`[REPO EVENT] ${req.body.repository.name}: ${req.body.action}`);
    if (req.body.action === 'created') {
      ID_SET.add(req.body.repository.description)
    } else if (req.body.action === 'deleted') {
      ID_SET.delete(req.body.repository.description)
    }
  }
  res.send();
});

server.get('/ping', (req, res) => res.send());

// Wake Heroku every 15 mins
setInterval(() => axios.get(`${process.env.MAGISK_SERVER_DOMAIN}/ping`), 15 * 60 * 1000);

export default server;

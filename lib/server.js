import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import { ID_SET } from './Shared';

import SubmissionHandler from './SubmissionHandler';
import RepoModerator from './RepoModerator';

const server = express();
server.use(bodyParser.json());

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
setInterval(() => axios.get(`${process.env.MAGISK_SERVER_DOMAIN}/ping`).then(res => {});

export default server;

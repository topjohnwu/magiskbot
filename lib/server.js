import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

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
  if (!req.body.created && req.body.repository) {
    console.log(`[EVENT] ${req.body.repository.name}`);
    RepoModerator(req.body.repository);
  }
  res.send();
});

server.get('/ping', (req, res) => res.send('PING!'));

// Wake Heroku every 15 mins
setInterval(() => axios.get(`${process.env.MAGISK_SERVER_DOMAIN}/ping`).then(res => console.log(res.data)), 15 * 60 * 1000);

export default server;

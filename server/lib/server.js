import express from 'express';
import bodyParser from 'body-parser';

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
})

export default server;


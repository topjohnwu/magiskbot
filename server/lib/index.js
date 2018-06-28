import express from 'express';
import bodyParser from 'body-parser';

import SubmissionHandler from './SubmissionHandler';
import RepoModerator from './RepoModerator';
import { submissions, magiskRepo } from './EntryPoint'

// const server = express();
// server.use(bodyParser.json());

submissions.listIssues().then(res => res.data.forEach(SubmissionHandler));
magiskRepo.getRepos().then(res => res.data.forEach(RepoModerator));

// TODO: Server webhook
/*
// Periodic checks
setInterval(() => {
  console.log('Running periodic checks');
  submissions.listIssues(null, (_, res) => res.forEach(processIssue));
  setTimeout(() => magiskRepo.getRepos((_, res) => res.forEach(checkAndFixRepo)), 300 * 1000);
}, 3600 * 1000);

// Start the server to monitor webhooks
const actions = ["opened", "reopened", "edited"]
server.post('/', (req, res) => {
  let event = req.body;
  if (actions.includes(event.action) && event.issue.state === 'open')
    processIssue(event.issue);
  res.json({ success: true });
})

server.listen(config.port, () => console.log(`Server listening to ${config.port}`));
*/

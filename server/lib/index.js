import express from 'express';
import bodyParser from 'body-parser';

import SubmissionHandler from './SubmissionHandler';
import RepoModerator from './RepoModerator';
import { submissions, magiskRepo, ID_SET } from './EntryPoint';

// const server = express();
// server.use(bodyParser.json());

magiskRepo.getRepos().then(res => res.data).then(repos => {
  // Add all repos to the set
  repos.forEach(repo => ID_SET.add(repo.description));
  repos.forEach(RepoModerator);
  submissions.listIssues().then(res => res.data.forEach(SubmissionHandler));
})

// submissions.listIssues().then(res => res.data.forEach(SubmissionHandler));
// magiskRepo.getRepos().then(res => res.data.forEach(RepoModerator));

// Start the server to monitor webhooks
// const actions = ["opened", "reopened", "edited"]
// server.post('/', (req, res) => {
//   let event = req.body;
//   if (actions.includes(event.action) && event.issue.state === 'open')
//     processIssue(event.issue);
//   res.json({ success: true });
// })

// server.listen(config.port, () => console.log(`Server listening to ${config.port}`));

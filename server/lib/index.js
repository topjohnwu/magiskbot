import express from 'express';
import bodyParser from 'body-parser';

import SubmissionHandler from './SubmissionHandler';
import RepoModerator from './RepoModerator';
import { submissions, magiskRepo, ID_SET } from './EntryPoint';
import server from './server';

magiskRepo.getRepos().then(res => res.data).then(repos => {
  // Add all repos to the set
  repos.forEach(repo => ID_SET.add(repo.description));
  repos.forEach(RepoModerator);
  submissions.listIssues().then(res => res.data.forEach(SubmissionHandler));
  // Start the server to monitor webhooks
  server.listen(8123, () => console.log(`Server listening to 8123`));
})

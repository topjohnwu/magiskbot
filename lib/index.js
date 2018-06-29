import SubmissionHandler from './SubmissionHandler';
import RepoModerator from './RepoModerator';
import server from './server';
import { submissions, magiskRepo, ID_SET } from './Shared';

magiskRepo.getRepos().then(res => res.data).then(repos => {
  // Add all repos to the set
  repos.forEach(repo => ID_SET.add(repo.description));
  submissions.listIssues().then(res => res.data.forEach(SubmissionHandler));
  // Start the server
  server.listen(process.env.PORT, () => console.log(`Server listening to ${process.env.PORT}`));
})

// Run full scan every hour
setInterval(() => magiskRepo.getRepos().then(res => res.data.forEach(RepoModerator)), 60 * 60 * 1000);

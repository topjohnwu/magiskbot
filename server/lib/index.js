import SubmissionHandler from './SubmissionHandler';
import RepoModerator from './RepoModerator';
import server from './server';
import { submissions, magiskRepo, ID_SET } from './Shared';

magiskRepo.getRepos().then(res => res.data).then(repos => {
  // Add all repos to the set
  repos.forEach(repo => ID_SET.add(repo.description));
  repos.forEach(RepoModerator);
  submissions.listIssues().then(res => res.data.forEach(SubmissionHandler));
  // Start the server to monitor webhooks
  server.listen(process.env.MAGISK_SERVER_PORT,
    () => console.log(`Server listening to ${process.env.MAGISK_SERVER_PORT}`));
})

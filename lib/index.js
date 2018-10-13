import SubmissionHandler from './SubmissionHandler';
import RepoSanitizer from './RepoSanitizer';
import server from './server';
import { submissions, magiskRepo } from './Shared';

magiskRepo.getRepos().then(res => res.data).then(repos => {
  submissions.listIssues().then(res => res.data.forEach(SubmissionHandler));
  // Start the server
  server.listen(process.env.PORT, () => console.log(`Server listening to ${process.env.PORT}`));
})

// Run full scan every day
setInterval(() => magiskRepo.getRepos().then(res => res.data.forEach(RepoSanitizer)), 24 * 60 * 60 * 1000);

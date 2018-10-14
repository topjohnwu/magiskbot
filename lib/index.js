import SubmissionHandler from './SubmissionHandler';
import RepoSanitizer from './RepoSanitizer';
import server from './server';
import { submissions, magiskRepo } from './Shared';

// Gobble through all existing issues
submissions.listIssues().then(res => res.data.forEach(SubmissionHandler));

// Start the server
server.listen(process.env.PORT,
  () => console.log(`Server listening to ${process.env.PORT}`));

const fullScan = () => magiskRepo.getRepos().then(res => res.data.forEach(RepoSanitizer));
fullScan();

// Schedule full scan to run once a day
setInterval(fullScan, 24 * 60 * 60 * 1000);

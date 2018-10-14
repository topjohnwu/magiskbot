import RepoProp from './RepoProp';
import { gh, ORGANIZATION, MAGISKBOT } from './Shared';
import errno from './errno';

const genIssueBody = err =>
`The moderation server has detected an issue of your repo:
> ${errno.strerr(err)}

**Important**: Please fix this issue within 14 days, and **CLOSE** this issue.
Failure to comply will result in removal of your repo from Magisk-Modules-Repo!`;


const RepoSanitizer = repo => {
  // Ignore the submission repo
  if (repo.name === 'submission')
    return;

  new RepoProp(repo.html_url).load().then(prop => {
    if (repo.description !== prop.id || repo.name !== prop.id) {
      console.log(`${repo.name}: Name / ID missmatch`);
      gh.getRepo(ORGANIZATION, repo.name).updateRepository({
        name: prop.id,
        description: prop.id
      });
    }
  })
  .catch(err => {
    console.log(`${repo.name}: ${errno.strerr(err)}`);

    switch (errno.code(err)) {
      case errno.ENOPROP:
        // This could be false negative, NOP for now
        break;
      case errno.EINVALCODE:
      case errno.EINVALID:
        // Pretty damn brutal errors, the developer is drunk
        gh.getRepo(ORGANIZATION, repo.name).deleteRepo().catch();
        break;
      case errno.EOUTDATE:
        // Send a kind reminder
        let ri = gh.getIssues(ORGANIZATION, repo.name);
        ri.listIssues({ creator: MAGISKBOT })
        .then(res => res.data)
        .then(issues => {
          let removeRepo = false;
          issues.forEach(issue => {
            // Check time
            if (((Date.now() - Date.parse(issue.created_at)) / (1000 * 60 * 60 * 24)) > 14)
              removeRepo = true;
          });
          if (removeRepo) {
            gh.getRepo(ORGANIZATION, repo.name).deleteRepo().catch();
          } else if (issues.length === 0) {
            ri.createIssue({
              title: '[MODERATION] Issue Detected',
              body: genIssueBody(err)
            });
          }
        });
        break;
    }
  });
}

export default RepoSanitizer;

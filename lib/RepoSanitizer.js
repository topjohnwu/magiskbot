import RepoProp from './RepoProp';
import { gh, ORGANIZATION } from './Shared';
import errno from './errno';


const RepoSanitizer = repo => {
  new RepoProp(repo.html_url).load().then(prop => {
    if (repo.description !== prop.id || repo.name !== prop.id) {
      console.log(`${repo.name}: Name/ID missmatch`);
      gh.getRepo(ORGANIZATION, repo.name).updateRepository({
        name: prop.id,
        description: prop.id
      });
    }
  })
  .catch(err => {
    /* This could be false negative, we don't want to risk it */
    if (errno.code(err) != errno.ENOPROP)
      throw err;
    // We still log ENOPROP though
    console.log(`${repo.name}: ${errno.strerr(err)}`);
  })
  .catch(err => {
    let ri = gh.getIssues(ORGANIZATION, repo.name);
    ri.listIssues().then(res => res.data).then(issues => {
      issues = issues.filter(issue => issue.user.login === process.env.MAGISK_SERVER_USERNAME);
      let removeRepo = false;
      issues.forEach(issue => {
        // Check time
        if (((Date.now() - Date.parse(issue.created_at)) / (1000 * 60 * 60 * 24)) > 14)
          removeRepo = true;
      });
      if (removeRepo) {
        gh.getRepo(ORGANIZATION, repo.name).deleteRepo().catch();
      } else if (issues.length === 0) {
        console.log(`${repo.name}: ${errno.strerr(err)}`);
        ri.createIssue({
          title: '[MODERATION] Issue Detected',
          body:
`The moderation server has detected an issue of your repo:
> ${errno.strerr(err)}

**Important**: Please fix this issue within 14 days, and **CLOSE** this issue.
Failure to comply will result in removal of your repo from Magisk-Modules-Repo!`
        });
      }
    });
  });
}

export default RepoSanitizer;

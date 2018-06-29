import RepoProp from './RepoProp';
import { bot, gh, submissions, magiskRepo, ORGANIZATION, ID_SET } from './EntryPoint';
import errno from './errno';


const RepoModerator = repo => {
  new RepoProp(repo.html_url).load().then(prop => {
    if (repo.description !== prop.id) {
      console.log(`${repo.name}: Description/ID missmatch`);
      // Fix the description
      gh.getRepo(ORGANIZATION, repo.name).updateRepository({
        name: repo.name,
        description: prop.id
      });
    }
  }).catch(err => {
    // Error found!
    console.log(`${repo.name}: ${repo.description} => ${errno.strerr(err)}`);
    let ri = gh.getIssues(ORGANIZATION, repo.name);
    ri.listIssues().then(res => res.data).then(issues => {
      issues = issues.filter(issue => issue.user.login === bot);
      let removeRepo = false;
      issues.forEach(issue => {
        // Check time
        if (((Date.now() - Date.parse(issue.created_at)) / (1000 * 60 * 60 * 24)) > 14)
          removeRepo = true;
      });
      if (removeRepo) {
        gh.getRepo(ORGANIZATION, repo.name).deleteRepo().then(() => ID_SET.delete(repo.description)).catch();
      } else if (issues.length === 0) {
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

export default RepoModerator;

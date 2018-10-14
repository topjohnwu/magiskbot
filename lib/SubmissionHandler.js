import util from 'util';
import getUrls from 'get-urls';

import RepoProp from './RepoProp';
import { gh, submissions, magiskRepo, ORGANIZATION } from './Shared'
import errno from './errno';

const createNewRepo = prop => {
  return magiskRepo.createRepo({
    name: prop.id,
    description: prop.id
  }).catch(err => {
    throw err.response.data.errors;
  }).then(res => {
    let repo = gh.getRepo(ORGANIZATION, res.data.name);
    return repo.importProject('git', prop.url)
    .then(() => repo.addCollaborator(prop.owner, 'admin').then(() => res.data))
    .catch(err => {
      // If any error occurs, cleanup
      repo.deleteRepo().catch();
      throw err;
    });
  });
}

const commentAndClose = (issue, comment) => {
  console.log(`#${issue.number}: ${comment}`)
  submissions.createIssueComment(issue.number, comment).catch(err => console.log(err));
  submissions.editIssue(issue.number, { state: 'closed' }).catch(err => console.log(err));
}

const SubmissionHandler = issue => {
  if (!issue.title.toUpperCase().startsWith('[SUBMISSION]'))
    return;
  let url = Array.from(getUrls(issue.body)).filter(url => url.includes('github'));
  if (url.length == 0) {
    commentAndClose(issue, `Bad Request: No GitHub link found!`);
  } else {
    url = url[0];
    new RepoProp(url).load()
    .then(prop => prop.checkDuplicate())
    .then(prop => {
      console.log(`#${issue.number}: [SUBMISSION] ${prop.name}: valid module`);
      // Perform only sanitize check if not labeled
      if (issue.labels.length === 0)
        return;

      let label = issue.labels[0];
      if (label.name === 'rejected') {
        commentAndClose(issue, `Submission rejected`);
      } else if (label.name === 'approved') {
        console.log(`#${issue.number}: [SUBMISSION] ${prop.name}: approved`);

        // Use the account of the issue, not the owner of the repo since it might be an organization
        prop.owner = issue.user.login;
        createNewRepo(prop).then(repo => {
          commentAndClose(issue, `New repo added: [${repo.name}](${repo.html_url})` +
                                 ', please accept the collaboration invitation in your email')
        }).catch(err =>
          commentAndClose(issue, 'Bad Request: Repository creation failed:\n' +
                                 `\`\`\`\n${util.inspect(err)}\n\`\`\``)
        );
      }
    }).catch(err =>
      commentAndClose(issue, `Bad Request: [${url}](${url}) is not a valid Magisk Module!\n` +
                             `Reason: ${errno.strerr(err)}`)
    );
  }
}

export default SubmissionHandler;

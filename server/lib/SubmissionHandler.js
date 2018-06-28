import util from 'util';
import getUrls from 'get-urls';

import RepoProp from './RepoProp';
import { gh, submissions, magiskRepo, ORGANIZATION } from './EntryPoint'
import errno from './errno';

const createNewRepo = prop => {
  return magiskRepo.createRepo({
    name: prop.name,
    description: prop.id
  }).catch(err => {
    throw err.response.data.errors;
  }).then(res => {
    let repo = gh.getRepo(res.data.owner.login, res.data.name);
    return repo.importProject('git', prop.url)
    .then(() => repo.addCollaborator(prop.owner, 'admin').then(() => res.data.html_url))
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
  if (issue.title.toUpperCase().startsWith('[SUBMISSION]')) {
    let url = Array.from(getUrls(issue.body)).filter(url => url.includes('github'));
    if (url.length == 0) {
      commentAndClose(issue, `Bad Request: No GitHub link found!`);
    } else {
      url = url[0];
      new RepoProp(url).load().then(prop => {
        console.log(`#${issue.number}: [SUBMISSION] ${prop.name}`);

        // Use the account of the issue, not the owner of the repo since it might be an organization
        prop.owner = issue.user.login;
        createNewRepo(prop).then(new_url =>
          commentAndClose(issue, `New repo added: [${prop.name}](${new_url}), please accept the collaboration invitation in your email`)
        ).catch(err =>
          commentAndClose(issue, `Bad Request: Repository creation failed:\n\`\`\`\n${util.inspect(err)}\n\`\`\``)
        );
      }).catch(err =>
        commentAndClose(issue, `Bad Request: [${url}](${url}) is not a valid Magisk Module!\nReason: ${errno.strerr(err)}`)
      );
    }

  } else if (issue.title.toUpperCase().startsWith('[REMOVAL]')) {
    let url = Array.from(getUrls(issue.body)).filter(url => url.includes('github'));
    if (url.length == 0) {
      commentAndClose(issue, `Bad Request: No GitHub link found!`);
    } else {
      url = url[0];
      new RepoProp(url).load(false).then(prop => {
        console.log(`#${issue}: [REMOVAL] ${prop.name}`);

        if (prop.owner != ORGANIZATION)
          errno.throw(errno.EOWNER, ORGANIZATION);

        let repo = gh.getRepo(prop.owner, prop.name);
        // Make sure the issue creator is a collaborator
        repo.isCollaborator(issue.user.login).then(() => {
          repo.deleteRepo().catch();
          commentAndClose(issue,`Repo removed as requested`);
        }).catch(() => errno.throw(errno.EOWNER, issue.user.login));
      }).catch(err =>
        commentAndClose(issue, `Bad Request: Unable to remove [${url}](${url})!\nReason: ${errno.strerr(err)}`)
      );
    }
  } else {
    commentAndClose(issue, `Unknown request title format`);
  }
}

export default SubmissionHandler;

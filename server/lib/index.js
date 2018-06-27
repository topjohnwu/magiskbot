import getUrls from 'get-urls';
import express from 'express';
import bodyParser from 'body-parser';

import Github from './Github';
import RepoProp from './RepoProp';

// Load config from external file, contains confidential information
import config from '../config';

const ORGANIZATION = 'Magisk-Modules-Repo';
const SUBMISSION_REPO = 'Magisk_Repo_Submissions';

const gh = new Github({
  username: config.username,
  token: config.token
});
const submissions = gh.getIssues('topjohnwu', SUBMISSION_REPO);
const magiskRepo = gh.getOrganization(ORGANIZATION);
const server = express();

// Allow json body
server.use(bodyParser.json());

const createNewRepo = prop => {
  return magiskRepo.createRepo({
    name: prop.name,
    description: prop.id
  }).then(res => {
    let repo = gh.getRepo(res.data.owner.login, res.data.name);

    repo.importProject('git', prop.url).then(() => {
      repo.addCollaborator(prop.owner, 'admin');
    }).catch(err => console.log(err));

    return res.data.html_url;
  }).catch(err => {
    throw JSON.stringify(err.response.data.errors, null, 2)
  });
}

const commentAndClose = (issue, comment) => {
  console.log(`#${issue.number}: ${comment}`)
  submissions.createIssueComment(issue.number, comment);
  submissions.editIssue(issue.number, { state: 'closed' });
}

const processIssue = issue => {
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
          commentAndClose(issue, `New repo added: [${new_url}](${new_url}), please accept the collaboration invitation in your email`)
        ).catch(err =>
          commentAndClose(issue, `Bad Request: Repository creation failed:\n\`\`\`\n${err}\n\`\`\``)
        );
      }).catch(err =>
        commentAndClose(issue, `Bad Request: [${url}](${url}) is not a valid Magisk Module!\nReason: ${err}`)
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
          throw 'Provided module is not from Magisk-Module-Repo'

        let repo = gh.getRepo(prop.owner, prop.name);
        // Make sure the issue creator is a collaborator
        repo.isCollaborator(issue.user.login).then(() => {
          repo.deleteRepo();
          commentAndClose(issue,`Repo removed as requested`);
        }).catch(() => {
          commentAndClose(issue, 'Bad Request: You are not a collaborator of the requested module!');
        });
      }).catch(err =>
        commentAndClose(issue, `Bad Request: Unable to remove [${url}](${url})!\nReason: ${err}`)
      );
    }
  } else {
    commentAndClose(issue, `Unknown request title format`);
  }
}

/* TODO: Repo Maintainance
const checkAndFixRepo = json => {
  let repo = gh.getRepo(json.owner.login, json.name);
  loadRepoInfo(json.html_url).then(meta => {
    if (json.description != meta.id) {
      console.log(`[${meta.name}] error: id missmatch`);
      // Fix the description to ID
      repo.updateRepository({
        name: meta.repo,
        description: meta.id
      });
    }
  }).catch(err => {
    console.log(`[${json.name}] error: ${err}`);
    // File an issue to notify the developer
    let repoIssues = gh.getIssues(json.owner.login, json.name);
    repoIssues.listIssues({ creator: config.username })
    .then(res => res.data)
    .then(res => {
      res = res.filter(issue => issue.title.startsWith('[MODERATION]'));
      if (res.length == 0) {
        // Do not duplicate notices
        repoIssues.createIssue({
          title: '[MODERATION] Please update your module',
          body: `${err}\n\nClose this issue after you resolved the issue.`
        });
      } else {
        let last_notify = (Date.now() - Date.parse(res[0].created_at)) / (1000 * 60 * 60 * 24);
        if (last_notify > 14) {
          // The repo hasn't been updated for more than 2 weeks since last notified
          console.log(`${Math.round(last_notify)} days old, remove [${json.name}]`);
          repo.deleteRepo();
        }
      }
    }).catch();
  });
}
*/

submissions.listIssues().then(res => res.data.forEach(processIssue));
// setTimeout(() => magiskRepo.getRepos((_, res) => res.forEach(checkAndFixRepo)), 300 * 1000);

// TODO: Server webhook
/*
// Periodic checks
setInterval(() => {
  console.log('Running periodic checks');
  submissions.listIssues(null, (_, res) => res.forEach(processIssue));
  setTimeout(() => magiskRepo.getRepos((_, res) => res.forEach(checkAndFixRepo)), 300 * 1000);
}, 3600 * 1000);

// Start the server to monitor webhooks
const actions = ["opened", "reopened", "edited"]
server.post('/', (req, res) => {
  let event = req.body;
  if (actions.includes(event.action) && event.issue.state === 'open')
    processIssue(event.issue);
  res.json({ success: true });
})

server.listen(config.port, () => console.log(`Server listening to ${config.port}`));
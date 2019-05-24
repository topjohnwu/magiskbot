import util from 'util';
import getUrls from 'get-urls';

import { gh, ORGANIZATION, SUBMISSION_REPO } from './Shared';
import Module from './Module';
import MagiskRepo from './MagiskRepo';
import errno from './errno';

class RepoSubmission {
  constructor(owner, name) {
    this.issues = gh.getIssues(owner, name);
  }

  async commentAndClose(issueId, comment) {
    console.log(`#${issueId}: ${comment}`);
    try {
      await this.issues.createIssueComment(issueId, comment);
      await this.issues.editIssue(issueId, { state: 'closed' });
    } catch (err) {
      console.log(err);
    }
  }

  async handleRequest(issue) {
    if (!issue.title.toUpperCase().startsWith('[SUBMISSION]')) { return; }
    const url = Array.from(getUrls(issue.body)).find(link => link.includes('github'));
    if (url === undefined) {
      this.commentAndClose(issue.number, 'Bad Request: No GitHub link found!');
      return;
    }
    const daysCreated = (Date.now() - new Date(issue.created_at)) / 86400000;
    if (daysCreated > 21) {
      this.commentAndClose(issue.number, 'Auto rejection: submission is older than 21 days');
      return;
    }
    try {
      const module = await new Module(url).load();
      await MagiskRepo.checkDuplicate(module.id);
      console.log(`#${issue.number}: [SUBMISSION] [${module.name}] is valid`);
      if (issue.labels.length === 0) {
        // Perform only sanitize check if not labeled
        return;
      }
      if (issue.labels.some(label => label.name === 'rejected')) {
        this.commentAndClose(issue.number, 'Submission rejected');
      } else if (issue.labels.some(label => label.name === 'approved')) {
        // Use the owner of the creator of issue, not repo
        module.owner = issue.user.login;
        console.log(`#${issue.number}: [SUBMISSION] [${module.name}] approved`);
        try {
          const repo = await MagiskRepo.addModule(module);
          this.commentAndClose(issue.number,
            `New repo added: [${repo.name}](${repo.html_url})\n`
          + 'Please accept the collaboration invitation in your email.');
        } catch (err) {
          this.commentAndClose(issue.number,
            'Bad Request: Repository creation failed:\n'
          + `\`\`\`\n${util.inspect(err)}\n\`\`\``);
        }
      }
    } catch (err) {
      this.commentAndClose(issue.number,
        `Bad Request: [${url}](${url})\n`
      + `Reason: ${errno.strerr(err)}`);
    }
  }

  async clearRequests() {
    try {
      (await this.issues.listIssues()).data.forEach(this.handleRequest, this);
    } catch (e) {
      // Should not happen, ignored
      console.log(e);
    }
  }
}

const Submission = new RepoSubmission(ORGANIZATION, SUBMISSION_REPO);

export default Submission;

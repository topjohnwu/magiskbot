import Github from './Github';

// Load config from external file, contains confidential information
import config from '../config';

const ORGANIZATION = 'Magisk-Modules-Repo';
const SUBMISSION_REPO = 'Magisk_Repo_Submissions';

const gh = new Github({
  username: config.username,
  token: config.token
});

module.exports = {
  bot: config.username,
  gh: gh,
  submissions: gh.getIssues('topjohnwu', SUBMISSION_REPO),
  magiskRepo: gh.getOrganization(ORGANIZATION),
  ORGANIZATION: ORGANIZATION
};

import Github from './Github';

// Load config from external file, contains confidential information
import { username, token } from '../config';

const ORGANIZATION = 'Magisk-Modules-Repo';
const SUBMISSION_REPO = 'Magisk_Repo_Submissions';

const ID_SET = new Set();
const gh = new Github({ username, token });

module.exports = {
  bot: username,
  gh,
  submissions: gh.getIssues('topjohnwu', SUBMISSION_REPO),
  magiskRepo: gh.getOrganization(ORGANIZATION),
  ORGANIZATION,
  ID_SET
};

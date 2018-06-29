import Github from './Github';

if (process.env.MAGISK_SERVER_USERNAME === undefined ||
  process.env.MAGISK_SERVER_TOKEN === undefined ||
  process.env.MAGISK_SERVER_DOMAIN === undefined ||
  process.env.PORT === undefined) {
  throw 'Error: Please setup environment variables'
}

const ORGANIZATION = 'Magisk-Modules-Repo';
const SUBMISSION_REPO = 'Magisk_Repo_Submissions';

const ID_SET = new Set();
const gh = new Github({ 
  username: process.env.MAGISK_SERVER_USERNAME,
  token: process.env.MAGISK_SERVER_TOKEN
});

module.exports = {
  gh,
  submissions: gh.getIssues('topjohnwu', SUBMISSION_REPO),
  magiskRepo: gh.getOrganization(ORGANIZATION),
  ORGANIZATION,
  ID_SET
};

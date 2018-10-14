import Github from './Github';

if (process.env.MAGISK_SERVER_TOKEN === undefined ||
  process.env.MAGISK_SERVER_DOMAIN === undefined ||
  process.env.MAGISK_WEBHOOK_SECRET === undefined ||
  process.env.PORT === undefined) {
  throw 'Error: Please setup environment variables'
}

const ORGANIZATION = 'Magisk-Modules-Repo';
const SUBMISSION_REPO = 'submission';
const MAGISKBOT = 'MagiskBot'

const gh = new Github({
  username: MAGISKBOT,
  token: process.env.MAGISK_SERVER_TOKEN
});

module.exports = {
  gh,
  submissions: gh.getIssues(ORGANIZATION, SUBMISSION_REPO),
  magiskRepo: gh.getOrganization(ORGANIZATION),
  ORGANIZATION,
  MAGISKBOT
};

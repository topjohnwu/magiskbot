import { Issue, PullRequest } from '@octokit/webhooks-types';
import { ghOwner as gh, ghBot } from './env.js';

export async function blockUser(username: string) {
  try {
    await gh.users.block({ username });
    console.log(`Blocked: ${username}`);
  } catch (e) {
    // ignore
  }
}

export async function blockAllSpam() {
  const spam = await gh.paginate(gh.issues.listForRepo, {
    owner: 'topjohnwu',
    repo: 'Magisk',
    labels: 'spam',
    state: 'all',
  });
  const spamUsers = new Set(spam.map((e) => e.user?.login as string));
  Promise.all([...spamUsers].map(blockUser));
}

export async function closeIssue(issue: Issue) {
  await ghBot.issues.update({
    owner: 'topjohnwu',
    repo: 'Magisk',
    issue_number: issue.number,
    state: 'closed',
  });
}

export async function closePR(pr: PullRequest) {
  await ghBot.pulls.update({
    owner: 'topjohnwu',
    repo: 'Magisk',
    pull_number: pr.number,
    state: 'closed',
  });
}

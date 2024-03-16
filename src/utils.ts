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

export async function closeIssue(repo: GithubRepo, issue: Issue, reason?: any) {
  await ghBot.issues.update({
    ...repo,
    issue_number: issue.number,
    state: 'closed',
    state_reason: reason || 'not_planned',
  });
}

export async function closePR(repo: GithubRepo, pr: PullRequest) {
  await ghBot.pulls.update({
    ...repo,
    pull_number: pr.number,
    state: 'closed',
  });
}

export async function commentIssue(
  repo: GithubRepo,
  issue: Issue,
  body: string
) {
  await ghBot.issues.createComment({
    ...repo,
    issue_number: issue.number,
    body,
  });
}

export async function getVersionCode(): Promise<string> {
  const props = (await gh.repos.getContent({
    owner: 'topjohnwu',
    repo: 'Magisk',
    path: 'gradle.properties',
  })) as any;

  const ver = Buffer.from(props.data.content, props.data.encoding)
    .toString()
    .split('\n')
    .filter((s) => s.startsWith('magisk.versionCode'))
    .at(-1)
    ?.replace('magisk.versionCode=', '') as string;

  return ver;
}

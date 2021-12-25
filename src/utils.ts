import { ghOwner as gh } from './env.js';

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

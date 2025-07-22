import { ghOwner as gh } from './env.js';

const MAGISK_REPO = { owner: 'topjohnwu', repo: 'Magisk' };
const GRADLE = 'gradle-cache-'
const GRADLE_BUILD = 'gradle-build-cache-'
const MACOS = 'sccache-macOS-'
const LINUX = 'sccache-Linux-'
const WINDOWS = 'sccache-Windows-'

export async function purgeOutdatedCache() {
  const operations = []
  const { data } = await gh.actions.getActionsCacheList(MAGISK_REPO);
  for (const type of [GRADLE, GRADLE_BUILD, MACOS, LINUX, WINDOWS]) {
    const caches = data.actions_caches.filter((cache) => cache.key!.startsWith(type));
    caches.sort((a, b) =>
      new Date(a.last_accessed_at!).getTime() - new Date(b.last_accessed_at!).getTime());
    if (caches.length > 1) {
      // Pop out the latest cache
      caches.pop()
      // Actually remove the outdated caches
      operations.push(...caches.map(
        (cache) => {
          console.log(`Removing ${cache.key}`)
          return gh.actions.deleteActionsCacheById({ ...MAGISK_REPO, cache_id: cache.id! })
        }
      ));
    }
  }
  return Promise.all(operations);
}

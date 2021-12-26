import fetch from 'node-fetch';
import { ghBot as gh } from './env.js';

const MAGISK_REPO = { owner: 'topjohnwu', repo: 'Magisk' };
const FILES_REPO = { owner: 'topjohnwu', repo: 'magisk-files' };
const FILES_REPO_OLD = { owner: 'topjohnwu', repo: 'magisk_files' };

// This the the amount of downloads back in the days when
// Magisk zip files are uploaded as XDA attachments.
// This number will no longer change as all attachments on
// XDA was removed after the location to download all
// files are switched to GitHub releases or jsdelivr.
const XDA_ATTACHMENTS = 25490945;

export default async function countDownloads() {
  const results = {
    totalString: '',
    total: 0,
    type: {
      apk: 0,
      zip: XDA_ATTACHMENTS,
    },
    source: {
      github: 0,
      jsdelivr: 0,
      xda: XDA_ATTACHMENTS,
    },
    release: {
      public: XDA_ATTACHMENTS,
      canary: 0,
    },
  };

  const metadata = await Promise.all([
    gh.paginate(gh.repos.listReleases, MAGISK_REPO),
    gh.paginate(gh.repos.listTags, FILES_REPO),
    gh.paginate(gh.repos.listCommits, { ...FILES_REPO, sha: 'canary' }),
    gh.paginate(gh.repos.listCommits, { ...FILES_REPO_OLD, sha: 'canary' }),
  ]);

  const [ghReleases, releaseTags, canaryCommits, oldCanaryCommits] = metadata;

  // Scan through all release assets
  ghReleases.forEach((release) => {
    release.assets.forEach((asset) => {
      const dlCount = asset.download_count;
      if (asset.name.endsWith('.apk')) {
        results.type.apk += dlCount;
      } else if (asset.name.endsWith('.zip')) {
        results.type.zip += dlCount;
      } else {
        return;
      }
      results.source.github += dlCount;
      results.release.public += dlCount;
    });
  });

  const statsUrl = (repo: string, name: string) =>
    `https://data.jsdelivr.com/v1/package/gh/topjohnwu/${repo}@${name}/stats/all`;

  const collectStats = (fileStats: JsdelivrFileInfo) => {
    Object.entries(fileStats).forEach(([path, info]) => {
      const { total } = info;
      if (path.endsWith('.apk')) {
        results.type.apk += total;
      } else if (path.endsWith('.zip')) {
        results.type.zip += total;
      } else {
        return;
      }
      results.source.jsdelivr += total;
      results.release.canary += total;
    });
  };

  const requests = [];

  // Scan through all release tags
  requests.push(
    ...releaseTags.map(async (tag) => {
      const { name } = tag;

      const stats = (await (
        await fetch(statsUrl('magisk-files', name))
      ).json()) as JsdelivrStats;

      collectStats(stats.files);
    })
  );

  // Scan through all canary commits
  requests.push(
    ...canaryCommits.map(async (commit) => {
      const { sha } = commit;

      const stats = (await (
        await fetch(statsUrl('magisk-files', sha))
      ).json()) as JsdelivrStats;

      collectStats(stats.files);
    })
  );

  // Scan through all old canary commits
  requests.push(
    ...oldCanaryCommits.map(async (commit) => {
      const { sha } = commit;

      const stats = (await (
        await fetch(statsUrl('magisk_files', sha))
      ).json()) as JsdelivrStats;

      collectStats(stats.files);
    })
  );

  // Fetch the blob sha of the existing count.json
  requests.push(
    gh.repos.getContent({
      ...FILES_REPO,
      path: 'count.json',
      ref: 'count',
    })
  );

  // Wait for all results
  const { sha } = (await Promise.all(requests)).at(-1)!.data as any;

  results.total = results.release.public + results.release.canary;
  results.totalString = results.total.toLocaleString();

  // Submit results to GitHub
  const dateStr = new Date().toJSON().replace('T', ' ').replace('Z', '');
  const resultStr = JSON.stringify(results, null, 2);

  await gh.repos.createOrUpdateFileContents({
    ...FILES_REPO,
    path: 'count.json',
    branch: 'count',
    message: `Update download counts: ${dateStr}`,
    content: Buffer.from(resultStr).toString('base64'),
    sha,
  });
}

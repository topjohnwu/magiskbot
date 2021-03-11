import axios from 'axios';
import { gh } from './Shared';

const magisk = gh.getRepo('topjohnwu', 'Magisk');
const files = gh.getRepo('topjohnwu', 'magisk-files');
const oldFiles = gh.getRepo('topjohnwu', 'magisk_files');

// This the the amount of downloads back in the days when
// Magisk zip files are uploaded as XDA attachments.
// This number will no longer change as all attachments on
// XDA was removed after the location to download all
// files are switched to GitHub releases.
const XDA_ATTACHMENTS = 25490945;

async function countDownloads() {
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

  const metadata = (await Promise.all([
    magisk.listReleases(),
    files.listTags(),
    files.listCommits({ sha: 'canary' }),
    oldFiles.listCommits({ sha: 'canary' }),
  ])).map((res) => res.data);

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

  const statsUrl = (repo, name) => `https://data.jsdelivr.com/v1/package/gh/topjohnwu/${repo}@${name}/stats/all`;

  const requests = [];

  // Scan through all release tags
  requests.push(...releaseTags.map(async (tag) => {
    const { name } = tag;
    const stats = (await axios.get(statsUrl('magisk-files', name))).data;

    Object.entries(stats.files).forEach(([fileName, info]) => {
      const dlCount = info.total;
      if (fileName.endsWith('.apk')) {
        results.type.apk += dlCount;
        results.source.jsdelivr += dlCount;
        results.release.public += dlCount;
      }
    });
  }));

  // Scan through all canary commits
  requests.push(...canaryCommits.map(async (commit) => {
    const { sha } = commit;
    const stats = (await axios.get(statsUrl('magisk-files', sha))).data;

    Object.entries(stats.files).forEach(([fileName, info]) => {
      const dlCount = info.total;
      if (fileName.endsWith('.apk')) {
        results.type.apk += dlCount;
        results.source.jsdelivr += dlCount;
        results.release.canary += dlCount;
      }
    });
  }));

  // Scan through all old canary commits
  requests.push(...oldCanaryCommits.map(async (commit) => {
    const { sha } = commit;
    const stats = (await axios.get(statsUrl('magisk_files', sha))).data;

    Object.entries(stats.files).forEach(([fileName, info]) => {
      const dlCount = info.total;
      if (fileName.endsWith('.apk')) {
        results.type.apk += dlCount;
      } else if (fileName.endsWith('.zip')) {
        results.type.zip += dlCount;
      } else {
        return;
      }
      results.source.jsdelivr += dlCount;
      results.release.canary += dlCount;
    });
  }));

  // Wait for all results
  await Promise.all(requests);

  results.total = results.release.public + results.release.canary;
  results.totalString = results.total.toLocaleString();

  // Submit results to GitHub
  const date = new Date();
  await files.writeFile(
    'count', 'count.json',
    `Update download counts: ${date.toJSON().replace('T', ' ').replace('Z', '')}`,
    JSON.stringify(results, null, 2), { encode: true },
  );
}

export default () => countDownloads().catch(/* Ignore errors */);

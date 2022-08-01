import fetch from 'node-fetch';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';
import { ghBot as gh } from './env.js';

const MAGISK_REPO = { owner: 'topjohnwu', repo: 'Magisk' };
const MANAGER_REPO = { owner: 'topjohnwu', repo: 'MagiskManager' };
const FILES_REPO = { owner: 'topjohnwu', repo: 'magisk-files' };
const FILES_REPO_OLD = { owner: 'topjohnwu', repo: 'magisk_files' };

// Mapping of Magisk Manager version to its corresponding Magisk version
const appVersionMapping: { [version: string]: string } = {
  '3.0': '10.1',
  '3.1': '11.0',
  '4.0': '11.1',
  '4.1': '11.1',
  '4.2': '11.1',
  '4.2.5': '11.1',
  '4.2.6': '11.1',
  '4.2.7': '11.6',
  '4.3.0': '12.0',
  '4.3.1': '12.0',
  '4.3.2': '12.0',
  '4.3.3': '12.0',
  '5.0.4': '13.1',
  '5.0.5': '13.2',
  '5.0.6': '13.2',
  '5.1.0': '13.3',
  '5.1.1': '13.3',
  '5.2.0': '13.3',
  '5.3.0': '14.0',
  '5.3.5': '14.2',
  '5.4.0': '14.3',
  '5.4.2': '14.3',
  '5.4.3': '14.5',
  '5.5.0': '14.6',
  '5.5.1': '15.0',
  '5.5.2': '15.1',
  '5.5.3': '15.2',
  '5.5.4': '15.2',
  '5.5.5': '15.3',
  '5.6.0': '15.4',
  '5.6.1': '16.0',
  '5.6.2': '16.1',
  '5.6.3': '16.2',
  '5.6.4': '16.3',
  '5.7.0': '16.4',
  '5.8.0': '16.6',
  '5.8.1': '16.6',
  '5.8.2': '16.6',
  '5.8.3': '16.7',
  '5.9.0': '16.7',
  '5.9.1': '17.0',
  '6.0.0': '17.2',
  '6.0.1': '17.3',
  '6.1.0': '18.0',
  '7.0.0': '18.1',
  '7.1.0': '19.0',
  '7.1.1': '19.0',
  '7.1.2': '19.1',
  '7.2.0': '19.2',
  '7.3.0': '19.2',
  '7.3.1': '19.2',
  '7.3.2': '19.2',
  '7.3.4': '19.4',
  '7.3.5': '20.0',
  '7.4.0': '20.1',
  '7.5.0': '20.2',
  '7.5.1': '20.3',
  '8.0.0': '21.0',
  '8.0.1': '21.0',
  '8.0.2': '21.0',
  '8.0.3': '21.1',
  '8.0.4': '21.2',
  '8.0.5': '21.2',
  '8.0.6': '21.3',
  '8.0.7': '21.4',
};

interface DetailInfo {
  total: number;
  type: {
    apk: number;
    zip: number;
  };
  source: {
    github: number;
    jsdelivr: number;
    xda: number;
  };
}

type VersionInfo = { [version: string]: DetailInfo };

type GhReleaseType = Unpacked<
  GetResponseDataTypeFromEndpointMethod<typeof gh.repos.listReleases>
>;
type GhCommitType = Unpacked<
  GetResponseDataTypeFromEndpointMethod<typeof gh.repos.listCommits>
>;
type GhContentType = Unpacked<
  GetResponseDataTypeFromEndpointMethod<typeof gh.repos.getContent>
>;

function newInfo(xda: number = 0): DetailInfo {
  return {
    total: xda,
    type: {
      apk: 0,
      zip: xda,
    },
    source: {
      github: 0,
      jsdelivr: 0,
      xda,
    },
  };
}

async function countDownloads() {
  const results = {
    totalString: '',
    total: 0,
    type: {
      apk: 0,
      zip: 0,
    },
    source: {
      github: 0,
      jsdelivr: 0,
      xda: 0,
    },
    release: {
      public: 0,
      canary: 0,
    },
    // The hardcoded numbers are the the amount of downloads back in the days
    // when Magisk zip files are uploaded as XDA attachments.
    versions: <VersionInfo>{
      '1': newInfo(8746),
      '2': newInfo(2251),
      '3': newInfo(3790),
      '4': newInfo(1220),
      '5': newInfo(2914),
      '6': newInfo(138838),
      '7': newInfo(119744),
      '8': newInfo(116796),
      '9': newInfo(203836),
      '10.1': newInfo(215176),
      '11.1': newInfo(573322),
      '11.6': newInfo(438886),
      '12.0': newInfo(3263706),
      '13.0': newInfo(274438),
      '13.1': newInfo(1018692),
      '13.2': newInfo(403556),
      '13.3': newInfo(1844372),
      '13.5': newInfo(39188),
      '13.6': newInfo(69874),
      '14.0': newInfo(4456314),
      '14.1': newInfo(11512),
      '14.2': newInfo(112020),
      '14.3': newInfo(247988),
      '14.5': newInfo(283694),
      '14.6': newInfo(85978),
      '15.0': newInfo(434572),
      '15.1': newInfo(460120),
      '15.2': newInfo(927436),
      '15.3': newInfo(3361850),
      '15.4': newInfo(97368),
      '16.0': newInfo(6043710),
      '16.1': newInfo(87628),
      '16.2': newInfo(140382),
    },
  };

  function getInfo(name: string): DetailInfo {
    let info = results.versions[name];
    if (info === undefined) {
      info = newInfo();
      results.versions[name] = info;
    }
    return info;
  }

  const metadata = await Promise.all([
    gh.paginate(gh.repos.listReleases, MAGISK_REPO),
    gh.paginate(gh.repos.listReleases, MANAGER_REPO),
    gh.paginate(gh.repos.listTags, FILES_REPO),
    gh.paginate(gh.repos.listCommits, { ...FILES_REPO, sha: 'canary' }),
    gh.paginate(gh.repos.listCommits, { ...FILES_REPO_OLD, sha: 'canary' }),
  ]);

  const [
    ghReleases,
    mgrReleases,
    releaseTags,
    canaryCommits,
    oldCanaryCommits,
  ] = metadata;

  function collectGhStats(name: string, release: GhReleaseType) {
    const info = getInfo(name);
    let count = 0;
    release.assets.forEach((asset) => {
      const dlCount = asset.download_count;
      if (asset.name.endsWith('.apk')) {
        info.type.apk += dlCount;
      } else if (asset.name.endsWith('.zip')) {
        info.type.zip += dlCount;
      } else {
        return;
      }
      count += dlCount;
    });
    info.total += count;
    info.source.github += count;
    return count;
  }

  // Scan through all release assets
  ghReleases.forEach((release) => {
    const tag = release.tag_name;
    let name: string;
    if (tag.includes('manager')) {
      const ver = tag.replace('manager-v', '');
      name = appVersionMapping[ver];
    } else {
      name = tag.replace('v', '');
    }
    const count = collectGhStats(name, release);
    results.release.public += count;
  });

  mgrReleases.forEach((release) => {
    const ver = release.tag_name.replace('v', '');
    const name = appVersionMapping[ver];
    const count = collectGhStats(name, release);
    results.release.public += count;
  });

  const statsUrl = (repo: string, name: string) =>
    `https://data.jsdelivr.com/v1/package/gh/topjohnwu/${repo}@${name}/stats/all`;

  async function collectJsStats(url: string, name: string) {
    const stats = (await (await fetch(url)).json()) as JsdelivrStats;
    const dInfo = getInfo(name);
    let count = 0;
    Object.entries(stats.files).forEach(([path, info]) => {
      const { total } = info;
      if (path.endsWith('.apk')) {
        dInfo.type.apk += total;
      } else if (path.endsWith('.zip')) {
        dInfo.type.zip += total;
      } else {
        return;
      }
      count += total;
    });
    dInfo.total += count;
    dInfo.source.jsdelivr += count;
    return count;
  }

  const requests = [];

  // Scan through all release tags
  requests.push(
    ...releaseTags.map(async (tag) => {
      const { name } = tag;
      const count = await collectJsStats(statsUrl('magisk-files', name), name);
      results.release.public += count;
    })
  );

  function processCanary(repo: string) {
    return async (commit: GhCommitType) => {
      if (!commit.commit.message.includes('Canary')) return;
      const { sha } = commit;
      const date = new Date(commit.commit.author?.date as string)
        .toISOString()
        .substring(0, 10);
      const ver = commit.commit.message.split(' ').at(-1) as string;
      const name = `${date} (${ver})`;
      const count = await collectJsStats(statsUrl(repo, sha), name);
      results.release.canary += count;
    };
  }

  // Scan through all canary commits
  requests.push(...canaryCommits.map(processCanary('magisk-files')));
  requests.push(...oldCanaryCommits.map(processCanary('magisk_files')));

  // Fetch the blob sha of the existing count.json
  requests.push(
    gh.repos.getContent({
      ...FILES_REPO,
      path: 'count.json',
      ref: 'count',
    })
  );

  // Wait for all results
  const { sha } = (await Promise.all(requests)).at(-1)!.data as GhContentType;

  function versionComparator(a: string, b: string): number {
    const an = Number(a);
    const bn = Number(b);
    if (Number.isNaN(an) && Number.isNaN(bn)) {
      return a < b ? 1 : -1;
    }
    if (Number.isNaN(an)) {
      return 1;
    }
    if (Number.isNaN(bn)) {
      return -1;
    }
    return bn - an;
  }

  // Sort and filter out empty release details
  results.versions = Object.keys(results.versions)
    .sort(versionComparator)
    .reduce((obj: VersionInfo, key: string) => {
      const val = results.versions[key];
      if (val.total === 0) return obj;
      const n = Number(key);
      const ks = Number.isNaN(n) ? key : n.toFixed(1);
      obj[ks] = val;
      return obj;
    }, {});

  // Aggregate results
  Object.values(results.versions).forEach((info) => {
    results.release.public += info.source.xda;
    results.source.xda += info.source.xda;
    results.source.github += info.source.github;
    results.source.jsdelivr += info.source.jsdelivr;
    results.type.apk += info.type.apk;
    results.type.zip += info.type.zip;
  });
  results.total = results.release.public + results.release.canary;
  results.totalString = results.total.toLocaleString();

  console.dir(results, { depth: null });

  // Submit results to GitHub
  const dateStr = new Date().toJSON().replace('T', ' ').replace('Z', '');
  const resultStr = `${JSON.stringify(results, null, 2)}\n`;

  await gh.repos.createOrUpdateFileContents({
    ...FILES_REPO,
    path: 'count.json',
    branch: 'count',
    message: `Update download counts: ${dateStr}`,
    content: Buffer.from(resultStr).toString('base64'),
    sha,
  });
}

countDownloads();

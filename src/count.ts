import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';
import { ghBot as gh } from './env.js';
import { frozenStats, appVersionMapping } from './frozen.js';

const MAGISK_REPO = { owner: 'topjohnwu', repo: 'Magisk' };
const MANAGER_REPO = { owner: 'topjohnwu', repo: 'MagiskManager' };
const FILES_REPO = { owner: 'topjohnwu', repo: 'magisk-files' };

interface ResultInfo {
  totalString: string;
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
  release: {
    public: number;
    canary: number;
  };
  versions: VersionInfo;
}

type GhReleaseType = Unpacked<
  GetResponseDataTypeFromEndpointMethod<typeof gh.repos.listReleases>
>;
type GhContentType = Unpacked<
  GetResponseDataTypeFromEndpointMethod<typeof gh.repos.getContent>
>;

async function countDownloads(): Promise<string> {
  const results: ResultInfo = {
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
    versions: structuredClone(frozenStats),
  };

  function getInfo(name: string): DetailInfo {
    let info = results.versions[name];
    if (info === undefined) {
      info = {
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
        is_canary: false,
      };
      results.versions[name] = info;
    }
    return info;
  }

  const metadata = await Promise.all([
    gh.paginate(gh.repos.listReleases, MAGISK_REPO),
    gh.paginate(gh.repos.listReleases, MANAGER_REPO),
  ]);

  const [ghReleases, mgrReleases] = metadata;

  function updateGhStats(name: string, release: GhReleaseType): DetailInfo {
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
    return info;
  }

  // Scan through all releases
  await Promise.all(
    ghReleases.map(async (release) => {
      const tag = release.tag_name;
      let name: string;
      if (tag.includes('manager')) {
        const ver = tag.replace('manager-v', '');
        name = appVersionMapping[ver];
      } else if (release.prerelease) {
        const date = new Date(release.created_at)
          .toISOString()
          .substring(0, 10);
        // Get sha value from the tag name
        const sha = (
          await gh.git.getRef({ ...MAGISK_REPO, ref: `tags/${tag}` })
        ).data.object.sha;
        const ver = sha.substring(0, 8);
        name = `${date} (${ver})`;
      } else {
        name = tag.replace('v', '');
      }
      const info = updateGhStats(name, release);
      info.is_canary = release.prerelease;
    }),
  );

  mgrReleases.forEach((release) => {
    const ver = release.tag_name.replace('v', '');
    const name = appVersionMapping[ver];
    updateGhStats(name, release);
  });

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
    results.source.xda += info.source.xda;
    results.source.github += info.source.github;
    results.source.jsdelivr += info.source.jsdelivr;
    results.type.apk += info.type.apk;
    results.type.zip += info.type.zip;
    if (info.is_canary) {
      results.release.canary += info.total;
    } else {
      results.release.public += info.total;
    }
  });
  results.total = results.release.public + results.release.canary;
  results.totalString = results.total.toLocaleString();

  // Trim the result object
  function trimObject(key: any, value: any): any {
    if (value === 0) {
      return undefined;
    }
    if (key === 'is_canary') {
      return undefined;
    }
    return value;
  }

  return `${JSON.stringify(results, trimObject, 2)}\n`;
}

export default async function updateCountJson() {
  const resultStr = await countDownloads();

  // Fetch the blob sha of the existing count.json
  const count_json = (
    await gh.repos.getContent({
      ...FILES_REPO,
      path: 'count.json',
      ref: 'count',
    })
  ).data as GhContentType;

  // Submit results to GitHub
  const dateStr = new Date().toJSON().replace('T', ' ').replace('Z', '');
  await gh.repos.createOrUpdateFileContents({
    ...FILES_REPO,
    path: 'count.json',
    branch: 'count',
    message: `Update download counts: ${dateStr}`,
    content: Buffer.from(resultStr).toString('base64'),
    sha: count_json.sha,
  });
}

// For testing only
// Uncomment the last line and call: `npx esrun src/count.ts`
async function localTest() {
  const resultStr = await countDownloads();
  const resultObj = JSON.parse(resultStr);
  console.dir(resultObj, { depth: null });
}
// localTest();

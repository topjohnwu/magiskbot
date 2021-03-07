import axios from 'axios';
import { gh } from './Shared';

const magisk = gh.getRepo('topjohnwu', 'Magisk');
const files = gh.getRepo('topjohnwu', 'magisk-files');
const XDA_ATTACHMENTS = 25490945;

async function countDownloads() {
  const count = {
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
  };

  // Scan through all release assets
  (await magisk.listReleases()).data.forEach((release) => {
    release.assets.forEach((asset) => {
      const dlCount = asset.download_count;
      if (asset.name.endsWith('.apk')) {
        count.type.apk += dlCount;
        count.source.github += dlCount;
      } else if (asset.name.endsWith('.zip')) {
        count.type.zip += dlCount;
        count.source.github += dlCount;
      }
    });
  });

  const genUrl = (name) => `https://data.jsdelivr.com/v1/package/gh/topjohnwu/magisk-files@${name}/stats/all`;

  // Scan through all tags
  const tagList = (await files.listTags()).data;
  await Promise.all(tagList.map(async (tag) => {
    const { name } = tag;
    const stats = (await axios.get(genUrl(name))).data;

    Object.keys(stats.files).forEach((fileName) => {
      const dlCount = stats.files[fileName].total;
      if (fileName.endsWith('.apk')) {
        count.type.apk += dlCount;
        count.source.jsdelivr += dlCount;
      }
    });
  }));

  count.total = count.source.xda + count.source.github + count.source.jsdelivr;
  count.totalString = count.total.toLocaleString();

  // Submit results to GitHub
  const date = new Date();
  await files.writeFile(
    'count', 'count.json',
    `Update download counts: ${date.toJSON().replace('T', ' ').replace('Z', '')}`,
    JSON.stringify(count, null, 2), { encode: true },
  );
}

export default () => { try { countDownloads(); } catch (e) { /* Ignore errors */ } };

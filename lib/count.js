import { gh } from './Shared';

const magisk = gh.getRepo('topjohnwu', 'Magisk');
const files = gh.getRepo('topjohnwu', 'magisk_files');

async function dlcount() {
  const count = {
    magisk: 25490945, /* Previously hosted on XDA */
    manager: 0,
    uninstaller: 0,
  };
  // Scan through all release assets and accumulate download_count
  (await magisk.listReleases()).data.forEach((release) => {
    release.assets.forEach((asset) => {
      if (asset.name.includes('MagiskManager')) {
        count.manager += asset.download_count;
      } else if (asset.name.includes('uninstaller')) {
        count.uninstaller += asset.download_count;
      } else if (asset.name.includes('.zip')) {
        count.magisk += asset.download_count;
      }
    });
  });
  count.manager = count.manager.toLocaleString();
  count.uninstaller = count.uninstaller.toLocaleString();
  count.magisk = count.magisk.toLocaleString();
  // Submit results to GitHub as CDN
  const date = new Date();
  await files.writeFile(
    'count', 'count.json',
    `Update download counts: ${date.toJSON().replace('T', ' ').replace('Z', '')}`,
    JSON.stringify(count, null, 2), { encode: true },
  );
  console.log(count);
}

export default () => { try { dlcount(); } catch (e) { /* Ignore errors */ } };

import { gh } from './Shared';

let magiskdl = 25490945;  /* Previously hosted on XDA */
let managerdl = 0;
let uninstallerdl = 0;

let magisk = gh.getRepo('topjohnwu', 'Magisk');
magisk.listReleases().then(res => res.data).then(releases => {
	releases.forEach(release => {
		release.assets.forEach(asset => {
			// console.log(`${asset.name}: ${asset.download_count}`)
			if (asset.name.includes('MagiskManager'))
				managerdl += asset.download_count;
			else if (asset.name.includes('uninstaller'))
				uninstallerdl += asset.download_count;
			else
				magiskdl += asset.download_count;
		})
	})
	// console.log('');
	console.log(`* Magisk: ${magiskdl}`);
	console.log(`* MagiskManager: ${managerdl}`);
	console.log(`* Uninstaller: ${uninstallerdl}`);
});

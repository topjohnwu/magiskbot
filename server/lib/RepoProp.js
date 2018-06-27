import parseGithubUrl from 'parse-github-url';
import axios from 'axios';

const MINMAGISK = 1500;

class RepoProp {
  constructor(url) {
    let { owner, name } = parseGithubUrl(url);
    this.url = url;
    this.name = name;
    this.metalink = `https://raw.githubusercontent.com/${owner}/${name}/master/module.prop`;
  }

  load(verify = true) {
    return axios.get(this.metalink)
      .catch(err => {
        throw '`module.prop` does not exist on `master` branch'
      })
      .then(res => {
        res.data.split('\n').forEach(line => {
          let s = line.split('=');
          if (s.length != 2)
            return;
          this[s[0]] = s[1];
        })
        if (verify) {
          if (this.id === undefined)
            throw 'Missing prop `id`'
          if (this.versionCode && !/^\d+$/.test(this.versionCode))
            throw `Invalid prop \`versionCode\`: \`${prop.versionCode}\``
          let version = this.minMagisk ? this.minMagisk : this.template;
          if (version < MINMAGISK)
            throw `Please update your module! Minimum: \`${MINMAGISK}\`; provided: \`${version}\``
        }
        return this;
      })
  }
}

export default RepoProp;
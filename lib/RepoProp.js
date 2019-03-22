import parse from 'parse-github-url';
import axios from 'axios';

import { gh, ORGANIZATION } from './Shared';
import errno from './errno';

class RepoProp {
  constructor(url) {
    const { owner, name } = parse(url);
    this.url = url;
    this.name = name;
    this.owner = owner;
    this.metalink = `https://raw.githubusercontent.com/${owner}/${name}/master/module.prop`;
  }

  load() {
    return axios.get(this.metalink)
      .catch(() => { throw errno.ENOPROP; })
      .then((res) => {
        res.data.split('\n').forEach((line) => {
          const s = line.split('=');
          if (s.length !== 2) {
            return;
          }
          this[s[0].trim()] = s[1].trim();
        });
        if (this.id === undefined || !/^[a-zA-Z][a-zA-Z0-9\._-]+$/.test(this.id)) {
          errno.throw(errno.EINVALID, this.id);
        }
        if (this.versionCode === undefined || !/^\d+$/.test(this.versionCode)) {
          errno.throw(errno.EINVALCODE, this.versionCode);
        }
        const version = this.minMagisk ? this.minMagisk : this.template;
        if (version < 1500) {
          errno.throw(errno.EOUTDATE, version);
        }
        return this;
      });
  }

  checkDuplicate() {
    // Check duplicate
    return gh.getRepo(ORGANIZATION, this.id).getDetails()
      .then(() => errno.throw(errno.EEXIST, this.id))
      .catch((err) => {
        if (err.code !== errno.EEXIST) {
          return new Promise((res, rej) => res(this));
        }
        throw err;
      });
  }
}

export default RepoProp;

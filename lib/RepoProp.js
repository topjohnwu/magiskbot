import parse from 'parse-github-url';
import axios from 'axios';

import errno from './errno';

class RepoProp {
  constructor(url) {
    let { owner, name } = parse(url);
    this.url = url;
    this.name = name;
    this.owner = owner;
    this.metalink = `https://raw.githubusercontent.com/${owner}/${name}/master/module.prop`;
  }

  load(verify = true) {
    return axios.get(this.metalink)
      .catch(err => { throw errno.ENOPROP })
      .then(res => {
        res.data.split('\n').forEach(line => {
          let s = line.split('=');
          if (s.length != 2)
            return;
          this[s[0]] = s[1];
        })
        if (verify) {
          if (this.id === undefined)
            throw errno.ENOID;
          if (this.versionCode && !/^\d+$/.test(this.versionCode))
            errno.throw(errno.EINVALCODE, this.versionCode);
          let version = this.minMagisk ? this.minMagisk : this.template;
          if (version < 1500)
            errno.throw(errno.EOUTDATE, version);
        }
        return this;
      })
  }
}

export default RepoProp;

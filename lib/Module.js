import parse from 'parse-github-url';
import axios from 'axios';

import { gh } from './Shared';
import errno from './errno';

class Module {
  constructor(url) {
    const { owner, name } = parse(url);
    this.url = url;
    this.repoName = name;
    this.owner = owner;
  }

  rawLink(file) {
    return `https://raw.githubusercontent.com/${this.owner}/${this.repoName}/master/${file}`;
  }

  async load() {
    let prop;
    try {
      prop = await axios.get(this.rawLink('module.prop'));
    } catch (e) {
      throw errno.ENOPROP;
    }
    prop.data.split('\n').forEach((line) => {
      const s = line.split('=');
      if (s.length !== 2) {
        return;
      }
      this[s[0].trim()] = s[1].trim();
    });
    if (this.id === undefined || !/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(this.id)) {
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
  }

  async isNew() {
    try {
      await axios.get(this.rawLink('install.sh'));
      try {
        // Check again if config.sh exists
        await axios.get(this.rawLink('config.sh'));
        return false;
      } catch (e) {
        return true;
      }
    } catch (e) {
      return false;
    }
  }

  async createIssue(title, body) {
    // Force enable issues
    try {
      await this.getRepo().updateRepository({
        name: this.repoName,
        has_issues: true,
      });
      await gh.getIssues(this.owner, this.repoName).createIssue({ title, body });
    } catch (e) {
      // Ignore
    }
  }

  getRepo() {
    return gh.getRepo(this.owner, this.repoName);
  }
}

export default Module;

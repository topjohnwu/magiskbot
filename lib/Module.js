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
      throw errno.EINVALMOD;
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

    const repo = this.getRepo();
    const master = (await repo.getBranch('master')).data;

    this.sha = master.commit.sha;
    this.lastUpdate = Date.parse(master.commit.commit.committer.date);

    return this;
  }

  getMeta() {
    const jsdelivr = (file) => `https://cdn.jsdelivr.net/gh/${this.owner}/${this.repoName}@${this.sha}/${file}`;
    return {
      id: this.id,
      last_update: this.lastUpdate,
      prop_url: jsdelivr('module.prop'),
      zip_url: `https://github.com/Magisk-Modules-Repo/${this.repoName}/archive/${this.sha}.zip`,
      notes_url: jsdelivr('README.md'),
    };
  }

  async isLegacy() {
    try {
      await axios.get(this.rawLink('install.sh'));
      return true;
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
      const res = await gh.getIssues(this.owner, this.repoName).createIssue({ title, body });
      console.log(`[${this.id}] Create issue #${res.data.number}: ${title}`);
    } catch (e) {
      // Ignore
    }
  }

  getRepo() {
    return gh.getRepo(this.owner, this.repoName);
  }
}

export default Module;

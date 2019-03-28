import { gh, ORGANIZATION } from './Shared';
import errno from './errno';
import Module from './Module';

class ModuleRepo {
  constructor(name, grave) {
    this.name = name;
    this.grave = grave;
    this.org = gh.getOrganization(name);
  }

  async addModule(module) {
    try {
      await this.org.createRepo({ name: module.id });
      const repo = gh.getRepo(this.name, module.id);
      try {
        await repo.importProject({ vcs: 'git', vcs_url: module.url });
        await repo.addCollaborator(module.owner, 'admin');
      } catch (err) {
        // If any error occurs, delete the repo and report
        repo.deleteRepo().catch();
        throw err;
      }
      return repo;
    } catch (err) {
      throw err.response.data;
    }
  }

  deleteModule(id) {
    // Don't actually delete, move to grave
    return gh.getRepo(this.name, id)
      .transferProject({ new_owner: this.grave }).catch();
  }

  async checkRepo(repo) {
    if (repo.name === 'submission') { return; /* Skip submission repo */ }
    try {
      await new Module(repo.html_url).load();
    } catch (err) {
      console.log(`${repo.name}: ${errno.strerr(err)}`);

      switch (errno.code(err)) {
        case errno.ENOPROP:
          // This could be false negative, NOP for now
          break;
        case errno.EINVALCODE:
        case errno.EINVALID:
          // Pretty damn brutal errors, kick the module out
          this.deleteModule(repo.name);
          break;
        default:
          break;
      }
    }
  }

  async getModules() {
    const mods = [];
    const repos = (await this.org.getRepos()).data;
    await Promise.all(repos.map(async (repo) => {
      try {
        mods.push(await new Module(repo.html_url).load());
      } catch (e) {
        // Ignore errors, we want all valid mods
      }
    }));
    return mods;
  }

  async moderate() {
    try {
      (await this.org.getRepos()).data.forEach(this.checkRepo);
    } catch (err) {
      // Should not happen, ignore
    }
  }

  async checkDuplicate(id) {
    try {
      await gh.getRepo(this.name, id).getDetails();
      // If the call succeeds, it means the module already exists
      return { code: errno.EEXIST, msg: id };
    } catch (e) {
      // Not exist
    }
    return null;
  }
}

const MagiskRepo = new ModuleRepo(ORGANIZATION, 'Magisk-Modules-Grave');

export default MagiskRepo;

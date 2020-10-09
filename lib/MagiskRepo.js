import { gh, ORGANIZATION, SUBMISSION_REPO } from './Shared';
import errno from './errno';
import Module from './Module';

class ModuleRepo {
  constructor(name, grave) {
    this.name = name;
    this.grave = grave;
    this.org = gh.getOrganization(name);
    this.submission = gh.getRepo(ORGANIZATION, SUBMISSION_REPO);
    this.modules = {};
  }

  async addModule(module) {
    try {
      const ret = await this.org.createRepo({ name: module.id });
      const repo = gh.getRepo(this.name, module.id);
      try {
        await repo.importProject({ vcs: 'git', vcs_url: module.url });
        await repo.addCollaborator(module.owner, 'admin');
      } catch (err) {
        // If any error occurs, delete the repo and report
        repo.deleteRepo().catch();
        throw err;
      }
      return ret.data;
    } catch (err) {
      throw err.response.data;
    }
  }

  deleteModule(id) {
    // Don't actually delete, move to grave
    return gh.getRepo(this.name, id)
      .transferRepo({ new_owner: this.grave }).catch();
  }

  async checkDuplicate(id) {
    try {
      const detail = (await gh.getRepo(this.name, id).getDetails()).data;
      if (detail.name === id) {
        // It could be redirected to old repo, double check if name matches
        throw { code: errno.EEXIST, msg: id };
      }
    } catch (e) {
      // Not exist
    }
  }

  async checkModule(module) {
    try {
      await module.load();
      return true;
    } catch (err) {
      console.log(`${module.repoName}: ${errno.strerr(err)}`);

      switch (errno.code(err)) {
        case errno.EINVALMOD:
          // This could be false negative, NOP for now
          break;
        case errno.EINVALCODE:
        case errno.EINVALID:
          // Pretty damn brutal errors, kick the module out
          this.deleteModule(module.repoName);
          break;
        default:
          break;
      }
      return false;
    }
  }

  async loadModules() {
    this.modules = {};
    const repos = (await this.org.getRepos()).data;
    await Promise.all(repos.map(async (repo) => {
      // Skip submission repo
      if (repo.name === 'submission') {
        return;
      }
      const module = new Module(repo.html_url);
      if (await this.checkModule(module)) {
        this.modules[repo.name] = module;
      }
    }));
  }

  async refreshModule(repo) {
    let module = this.modules[repo.name];
    if (!module) {
      module = new Module(repo.html_url);
    }
    if (await this.checkModule(module)) {
      this.modules[repo.name] = module;
    }
  }

  async handleRepoEvent(event) {
    switch (event.action) {
      case 'deleted':
        delete this.modules[event.repository.name];
        break;
      case 'created':
        await this.refreshModule(event.repository);
        break;
      case 'renamed':
        // Reload everything to keep in track
        await this.loadModules();
        break;
      default:
        break;
    }
  }

  getModulesJSON() {
    const modules = Object.values(this.modules).map((module) => module.getMeta());
    modules.sort((a, b) => b.last_update - a.last_update);
    return {
      name: 'Magisk Modules Repo (Official)',
      last_update: modules[0].last_update,
      modules,
    };
  }

  async publishModulesJSON() {
    const json = this.getModulesJSON();
    const msg = `Publish modules: ${new Date().toJSON().replace('T', ' ').replace('Z', '')}`;
    console.log(msg);
    await this.submission.writeFile(
      'modules', 'modules.json', msg,
      JSON.stringify(json, null, 2), { encode: true },
    );
  }
}

const MagiskRepo = new ModuleRepo(ORGANIZATION, 'Magisk-Modules-Grave');

export default MagiskRepo;

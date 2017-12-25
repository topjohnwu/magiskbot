/* This is an automation server to handle all repo requests
 */
const GitHub = require('github-api');
const getUrls = require('get-urls');
const ghParse = require('parse-github-url');
const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const localtunnel = require('localtunnel');

// Load config from external file, contains confidential information
const config = require('./config')

const gh = new GitHub({ username: config.username, token: config.token });
const submissions = gh.getIssues(config.username, config.submissions);
const online = gh.getOrganization(config.org);
const server = express();

// Allow json body
server.use(bodyParser.json());

const handleFetchError = (res) => {
  if (!res.ok)
    throw res;
  return res;
}

const parseProp = (data) => {
  let arr = data.split('\n');
  let ret = {};
  arr.forEach((line) => {
    let s = line.split('=');
    if (s.length != 2)
      return;
    ret[s[0]] = s[1];
  })
  return ret;
}

const loadRepoInfo = (url, verify=true) => {
  let {owner, name} = ghParse(url);
  let metalink = `https://raw.githubusercontent.com/${owner}/${name}/master/module.prop`;
  return fetch(metalink)
    .then((res) => {
      if (!res.ok)
        throw '`module.prop` does not exist on `master` branch';
      return res;
    })
    .then(res => res.text())
    .then(body => parseProp(body))
    .then(json => {
      json.owner = owner;
      json.repo = name;
      return json;
    })
    .then(meta => {
      if (verify) {
        // Check if metadata are all valid
        if (meta.id === undefined)
          throw 'Missing prop `id`'
        if (meta.versionCode && ! /^\d+$/.test(meta.versionCode))
          throw `Invalid prop \`versionCode\`: \`${meta.versionCode}\``
        // Reject anything lower than 1400
        let version = meta.minMagisk ? meta.minMagisk : meta.template;
        if (version < 1400)
          throw `Please update your module! Minimum: \`1400\`; provided: \`${version}\``
      }
      return meta;
    })
}

const createNewRepo = (meta, url) => {
  return online.createRepo({
    name: meta.repo,
    description: meta.id
  })
  .then(res => {
    let repo = gh.getRepo(res.data.owner.login, res.data.name);

    // Import from url
    let headers = repo.__getRequestHeaders(null);
    headers.Accept = 'application/vnd.github.barred-rock-preview';
    fetch(`https://api.github.com/repos/${repo.__fullname}/import`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify({
        vcs: 'git',
        vcs_url: url
      })
    })
    .then(handleFetchError)
    .then(() => {
      // Add collaborator
      repo._request('PUT', `/repos/${repo.__fullname}/collaborators/${meta.owner}`, { permission: 'admin' });
      // Unwatch the repo
      repo._request('DELETE', `/repos/${repo.__fullname}/subscription`);
    })
    .catch(err => console.log('Error occured:\n', JSON.stringify(err, null, 2)));

    return res.data.html_url;
  })
  .catch(err => { throw JSON.stringify(err.response.data.errors, null, 2) });
}

const commentAndClose = (issue, num, comment) => {
  console.log(`#${num}: ${comment}`)
  issue.createIssueComment(num, comment);
  issue.editIssue(num, { state: 'closed' });
}

const processIssue = issue => {
  if (issue.title.toLowerCase().startsWith('[submission]')) {
    let url = Array.from(getUrls(issue.body)).filter(url => url.includes('github'));
    if (url.length == 0) {
      commentAndClose(submissions, issue.number, `Bad Request: No GitHub link found!`);
    } else {
      url = url[0];
      loadRepoInfo(url).then(meta => {
        createNewRepo(meta, url)
        .then((new_url) => {
          commentAndClose(submissions, issue.number,
            `New repo added: [${meta.repo}](${new_url}), please accept the collaboration invitation in your email`)
        })
        .catch(err =>
          commentAndClose(submissions, issue.number,
            `Bad Request: Repository creation failed:\n\`\`\`\n${err}\n\`\`\``)
        );
      }).catch(err =>
        commentAndClose(submissions, issue.number,
          `Bad Request: Your [submission link](${url}) is not a valid Magisk Module!\nReason: ${err}`)
      );
    }

  } else if (issue.title.toLowerCase().startsWith('[removal]')) {
    let url = Array.from(getUrls(issue.body)).filter(url => url.includes('github'));
    if (url.length == 0) {
      commentAndClose(submissions, issue.number, `Bad Request: No GitHub link found!`);
    } else {
      url = url[0];
      loadRepoInfo(url, false).then(meta => {
        if (meta.owner != config.org)
          throw `Provided module is not from ${config.org}`

        let repo = gh.getRepo(meta.owner, meta.repo);
        // Make sure the issue creator is a collaborator
        repo.isCollaborator(issue.user.login)
        .then(() => {
          repo.deleteRepo();
          commentAndClose(submissions, issue.number,`Repo removed`);
        }).catch(() => {
          commentAndClose(submissions, issue.number,
            `Bad Request: You are not a collaborator of the requested module!`);
        })
      }).catch(err =>
        commentAndClose(submissions, issue.number,
          `Bad Request: Your [removal link](${url}) is not a valid Magisk Module!\nReason: ${err}`)
      );
    }
  } else {
    commentAndClose(submissions, issue.number, `Unknown request title format`);
  }
}

const checkAndFixRepo = json => {
  let repo = gh.getRepo(json.owner.login, json.name);
  loadRepoInfo(json.html_url).then(meta => {
    if (json.description != meta.id) {
      console.log(`[${meta.name}] error: id missmatch`);
      // Fix the description to ID
      repo.updateRepository({
        name: meta.repo,
        description: meta.id
      });
    }
  }).catch(err => {
    console.log(`[${json.name}] error: ${err}`);
    let last_push = (Date.now() - Date.parse(json.pushed_at)) / (1000 * 60 * 60 * 24);
    if (last_push > 14) {
      // The repo hasn't been updated for more than 2 weeks, remove from repo
      console.log(`${Math.round(last_push)} days old, remove [${json.name}]`);
      repo.deleteRepo();
    } else {
      // File an issue to notify the developer
      let repoIssues = gh.getIssues(json.owner.login, json.name);
      repoIssues.listIssues({ creator: config.username })
      .then(res => {
        if (! res instanceof Array)
          return;
        res = res.filter(issue => issue.title.startsWith('[MODERATION]'));
        // Do not duplicate notices
        if (res.length == 0) {
          repoIssues.createIssue({
            title: '[MODERATION] Please update your module',
            body: `${err}\n\nClose this issue after you resolved the issue.`
          });
        }
      }).catch();
    }
  });
}

const startLocalTunnel = () => {
  // Server initial startup, process through all requests
  submissions.listIssues(null, (_, res) => res.forEach(processIssue))

  // Repo maintenance
  online.getRepos((_, res) => res.forEach(checkAndFixRepo))

  return localtunnel(config.port, { subdomain: config.domain }, (err, tunnel) => {
      if (err) {
        console.log(err);
        return startLocalTunnel();
      } else {
        console.log(`LocalTunnel: ${tunnel.url}`);
      }
  });
}

const actions = ["opened", "reopened", "edited"]

// Start the server
server.post('/', (req, res) => {
  let event = req.body;
  if (actions.includes(event.action) && event.issue.state === 'open') {
    processIssue(event.issue);
  }
  res.json({ success: true });
})

server.listen(config.port, () => console.log(`Server listening to ${config.port}`));

// Enable localtunnel to expose our link
let tunnel = startLocalTunnel();

tunnel.on('close', () => {
  console.log('localtunnel closed...');
  tunnel = startLocalTunnel();
});

tunnel.on('error', (err) => {
  console.log('localtunnel error...');
  tunnel = startLocalTunnel();
});

/**
 * @file
 * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
 * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
 *             Github.js is freely distributable.
 */

import Requestable from './Requestable';
import Utf8 from 'utf8';
import { Base64 } from 'js-base64';
import debug from 'debug';
const log = debug('github:repository');

/**
 * Respository encapsulates the functionality to create, query, and modify files.
 */
class Repository extends Requestable {
   /**
    * Create a Repository.
    * @param {string} fullname - the full name of the repository
    * @param {Requestable.auth} [auth] - information required to authenticate to Github
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    */
   constructor(fullname, auth, apiBase) {
      super(auth, apiBase);
      this.__fullname = fullname;
      this.__currentTree = {
         branch: null,
         sha: null,
      };
   }

   /**
    * Get a reference
    * @see https://developer.github.com/v3/git/refs/#get-a-reference
    * @param {string} ref - the reference to get
    * @return {Promise} - the promise for the http request
    */
   getRef(ref) {
      return this._request('GET', `/repos/${this.__fullname}/git/refs/${ref}`, null);
   }

   /**
    * Create a reference
    * @see https://developer.github.com/v3/git/refs/#create-a-reference
    * @param {Object} options - the object describing the ref
    * @return {Promise} - the promise for the http request
    */
   createRef(options) {
      return this._request('POST', `/repos/${this.__fullname}/git/refs`, options);
   }

   /**
    * Delete a reference
    * @see https://developer.github.com/v3/git/refs/#delete-a-reference
    * @param {string} ref - the name of the ref to delte
    * @return {Promise} - the promise for the http request
    */
   deleteRef(ref) {
      return this._request('DELETE', `/repos/${this.__fullname}/git/refs/${ref}`, null);
   }

   /**
    * Delete a repository
    * @see https://developer.github.com/v3/repos/#delete-a-repository
    * @return {Promise} - the promise for the http request
    */
   deleteRepo() {
      return this._request('DELETE', `/repos/${this.__fullname}`, null);
   }

   /**
    * List the tags on a repository
    * @see https://developer.github.com/v3/repos/#list-tags
    * @return {Promise} - the promise for the http request
    */
   listTags() {
      return this._request('GET', `/repos/${this.__fullname}/tags`, null);
   }

   /**
    * List the open pull requests on the repository
    * @see https://developer.github.com/v3/pulls/#list-pull-requests
    * @param {Object} options - options to filter the search
    * @return {Promise} - the promise for the http request
    */
   listPullRequests(options) {
      options = options || {};
      return this._request('GET', `/repos/${this.__fullname}/pulls`, options);
   }

   /**
    * Get information about a specific pull request
    * @see https://developer.github.com/v3/pulls/#get-a-single-pull-request
    * @param {number} number - the PR you wish to fetch
    * @return {Promise} - the promise for the http request
    */
   getPullRequest(number) {
      return this._request('GET', `/repos/${this.__fullname}/pulls/${number}`, null);
   }

   /**
    * List the files of a specific pull request
    * @see https://developer.github.com/v3/pulls/#list-pull-requests-files
    * @param {number|string} number - the PR you wish to fetch
    * @return {Promise} - the promise for the http request
    */
   listPullRequestFiles(number) {
      return this._request('GET', `/repos/${this.__fullname}/pulls/${number}/files`, null);
   }

   /**
    * Compare two branches/commits/repositories
    * @see https://developer.github.com/v3/repos/commits/#compare-two-commits
    * @param {string} base - the base commit
    * @param {string} head - the head commit
    * @return {Promise} - the promise for the http request
    */
   compareBranches(base, head) {
      return this._request('GET', `/repos/${this.__fullname}/compare/${base}...${head}`, null);
   }

   /**
    * List all the branches for the repository
    * @see https://developer.github.com/v3/repos/#list-branches
    * @return {Promise} - the promise for the http request
    */
   listBranches() {
      return this._request('GET', `/repos/${this.__fullname}/branches`, null);
   }

   /**
    * Get a raw blob from the repository
    * @see https://developer.github.com/v3/git/blobs/#get-a-blob
    * @param {string} sha - the sha of the blob to fetch
    * @return {Promise} - the promise for the http request
    */
   getBlob(sha) {
      return this._request('GET', `/repos/${this.__fullname}/git/blobs/${sha}`, null);
   }

   /**
    * Get a single branch
    * @see https://developer.github.com/v3/repos/branches/#get-branch
    * @param {string} branch - the name of the branch to fetch
    * @returns {Promise} - the promise for the http request
    */
   getBranch(branch) {
      return this._request('GET', `/repos/${this.__fullname}/branches/${branch}`, null);
   }

   /**
    * Get a commit from the repository
    * @see https://developer.github.com/v3/repos/commits/#get-a-single-commit
    * @param {string} sha - the sha for the commit to fetch
    * @return {Promise} - the promise for the http request
    */
   getCommit(sha, cb) {
      return this._request('GET', `/repos/${this.__fullname}/git/commits/${sha}`, null);
   }

   /**
    * List the commits on a repository, optionally filtering by path, author or time range
    * @see https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
    * @param {Object} [options] - the filtering options for commits
    * @param {string} [options.sha] - the SHA or branch to start from
    * @param {string} [options.path] - the path to search on
    * @param {string} [options.author] - the commit author
    * @param {(Date|string)} [options.since] - only commits after this date will be returned
    * @param {(Date|string)} [options.until] - only commits before this date will be returned
    * @return {Promise} - the promise for the http request
    */
   listCommits(options) {
      options = options || {};

      options.since = this._dateToISO(options.since);
      options.until = this._dateToISO(options.until);

      return this._request('GET', `/repos/${this.__fullname}/commits`, options);
   }

    /**
     * Gets a single commit information for a repository
     * @see https://developer.github.com/v3/repos/commits/#get-a-single-commit
     * @param {string} ref - the reference for the commit-ish
     * @return {Promise} - the promise for the http request
     */
   getSingleCommit(ref) {
      ref = ref || '';
      return this._request('GET', `/repos/${this.__fullname}/commits/${ref}`, null);
   }

   /**
    * List the commit statuses for a particular sha, branch, or tag
    * @see https://developer.github.com/v3/repos/statuses/#list-statuses-for-a-specific-ref
    * @param {string} sha - the sha, branch, or tag to get statuses for
    * @return {Promise} - the promise for the http request
    */
   listStatuses(sha) {
      return this._request('GET', `/repos/${this.__fullname}/commits/${sha}/statuses`, null);
   }

   /**
    * Get a description of a git tree
    * @see https://developer.github.com/v3/git/trees/#get-a-tree
    * @param {string} treeSHA - the SHA of the tree to fetch
    * @return {Promise} - the promise for the http request
    */
   getTree(treeSHA) {
      return this._request('GET', `/repos/${this.__fullname}/git/trees/${treeSHA}`, null);
   }

   /**
    * Create a blob
    * @see https://developer.github.com/v3/git/blobs/#create-a-blob
    * @param {(string|Buffer|Blob)} content - the content to add to the repository
    * @param {boolean} raw - true to return raw data
    * @return {Promise} - the promise for the http request
    */
   createBlob(content, raw) {
      let postBody = this._getContentObject(content);

      if (raw) {
         postBody.AcceptHeader = 'v3.raw'
      }

      log('sending content', postBody);
      return this._request('POST', `/repos/${this.__fullname}/git/blobs`, postBody, raw ? 'arraybuffer' : 'json');
   }

   /**
    * Get the object that represents the provided content
    * @param {string|Buffer|Blob} content - the content to send to the server
    * @return {Object} the representation of `content` for the GitHub API
    */
   _getContentObject(content) {
      if (typeof content === 'string') {
         log('contet is a string');
         return {
            content: Utf8.encode(content),
            encoding: 'utf-8',
         };

      } else if (typeof Buffer !== 'undefined' && content instanceof Buffer) {
         log('We appear to be in Node');
         return {
            content: content.toString('base64'),
            encoding: 'base64',
         };

      } else if (typeof Blob !== 'undefined' && content instanceof Blob) {
         log('We appear to be in the browser');
         return {
            content: Base64.encode(content),
            encoding: 'base64',
         };

      } else { // eslint-disable-line
         log(`Not sure what this content is: ${typeof content}, ${JSON.stringify(content)}`);
         throw new Error('Unknown content passed to postBlob. Must be string or Buffer (node) or Blob (web)');
      }
   }

   /**
    * Update a tree in Git
    * @see https://developer.github.com/v3/git/trees/#create-a-tree
    * @param {string} baseTreeSHA - the SHA of the tree to update
    * @param {string} path - the path for the new file
    * @param {string} blobSHA - the SHA for the blob to put at `path`
    * @return {Promise} - the promise for the http request
    * @deprecated use {@link Repository#createTree} instead
    */
   updateTree(baseTreeSHA, path, blobSHA) {
      let newTree = {
         base_tree: baseTreeSHA, // eslint-disable-line
         tree: [{
            path: path,
            sha: blobSHA,
            mode: '100644',
            type: 'blob',
         }],
      };

      return this._request('POST', `/repos/${this.__fullname}/git/trees`, newTree);
   }

   /**
    * Create a new tree in git
    * @see https://developer.github.com/v3/git/trees/#create-a-tree
    * @param {Object} tree - the tree to create
    * @param {string} baseSHA - the root sha of the tree
    * @return {Promise} - the promise for the http request
    */
   createTree(tree, baseSHA) {
      return this._request('POST', `/repos/${this.__fullname}/git/trees`, {
         tree,
         base_tree: baseSHA, // eslint-disable-line camelcase
      });
   }

   /**
    * Add a commit to the repository
    * @see https://developer.github.com/v3/git/commits/#create-a-commit
    * @param {string} parent - the SHA of the parent commit
    * @param {string} tree - the SHA of the tree for this commit
    * @param {string} message - the commit message
    * @return {Promise} - the promise for the http request
    */
   commit(parent, tree, message) {
      let data = {
         message,
         tree,
         parents: [parent],
      };

      return this._request('POST', `/repos/${this.__fullname}/git/commits`, data)
         .then((response) => {
            this.__currentTree.sha = response.data.sha; // Update latest commit
            return response;
         });
   }

   /**
    * Update a ref
    * @see https://developer.github.com/v3/git/refs/#update-a-reference
    * @param {string} ref - the ref to update
    * @param {string} commitSHA - the SHA to point the reference to
    * @param {boolean} force - indicates whether to force or ensure a fast-forward update
    * @return {Promise} - the promise for the http request
    */
   updateHead(ref, commitSHA, force) {
      return this._request('PATCH', `/repos/${this.__fullname}/git/refs/${ref}`, {
         sha: commitSHA,
         force: force,
      });
   }

   /**
    * Update commit status
    * @see https://developer.github.com/v3/repos/statuses/
    * @param {string} commitSHA - the SHA of the commit that should be updated
    * @param {object} options - Commit status parameters
    * @param {string} options.state - The state of the status. Can be one of: pending, success, error, or failure.
    * @param {string} [options.target_url] - The target URL to associate with this status.
    * @param {string} [options.description] - A short description of the status.
    * @param {string} [options.context] - A string label to differentiate this status among CI systems.
    * @return {Promise} - the promise for the http request
    */
   updateStatus(commitSHA, options) {
      return this._request('POST', `/repos/${this.__fullname}/statuses/${commitSHA}`, options);
   }

   /**
    * Update repository information
    * @see https://developer.github.com/v3/repos/#edit
    * @param {object} options - New parameters that will be set to the repository
    * @param {string} options.name - Name of the repository
    * @param {string} [options.description] - A short description of the repository
    * @param {string} [options.homepage] - A URL with more information about the repository
    * @param {boolean} [options.private] - Either true to make the repository private, or false to make it public.
    * @param {boolean} [options.has_issues] - Either true to enable issues for this repository, false to disable them.
    * @param {boolean} [options.has_wiki] - Either true to enable the wiki for this repository, false to disable it.
    * @param {boolean} [options.has_downloads] - Either true to enable downloads, false to disable them.
    * @param {string} [options.default_branch] - Updates the default branch for this repository.
    * @return {Promise} - the promise for the http request
    */
   updateRepository(options) {
      return this._request('PATCH', `/repos/${this.__fullname}`, options);
   }

  /**
    * Get information about the repository
    * @see https://developer.github.com/v3/repos/#get
    * @return {Promise} - the promise for the http request
    */
   getDetails() {
      return this._request('GET', `/repos/${this.__fullname}`, null);
   }

   /**
    * List the contributors to the repository
    * @see https://developer.github.com/v3/repos/#list-contributors
    * @return {Promise} - the promise for the http request
    */
   getContributors() {
      return this._request('GET', `/repos/${this.__fullname}/contributors`, null);
   }

   /**
    * List the contributor stats to the repository
    * @see https://developer.github.com/v3/repos/#list-contributors
    * @return {Promise} - the promise for the http request
    */
   getContributorStats() {
      return this._request('GET', `/repos/${this.__fullname}/stats/contributors`, null);
   }

   /**
    * List the users who are collaborators on the repository. The currently authenticated user must have
    * push access to use this method
    * @see https://developer.github.com/v3/repos/collaborators/#list-collaborators
    * @param {string} affiliation - filter collaborators returned by their affiliation
    * @return {Promise} - the promise for the http request
    */
   getCollaborators(affiliation = 'all') {
      return this._request('GET', `/repos/${this.__fullname}/collaborators`, { affiliation });
   }

   /**
    * Check if a user is a collaborator on the repository
    * @see https://developer.github.com/v3/repos/collaborators/#check-if-a-user-is-a-collaborator
    * @param {string} username - the user to check
    * @return {Promise} - the promise for the http request {Boolean} [description]
    */
   isCollaborator(username) {
      return this._request('GET', `/repos/${this.__fullname}/collaborators/${username}`, null);
   }

   /**
    * Add user as a collaborator of the repository
    * @see https://developer.github.com/v3/repos/collaborators/#add-user-as-a-collaborator
    * @param {string} username - the user to add
    * @param {string} permission - 'pull', 'push', or 'admin'
    * @return {Promise} - the promise for the http request {Boolean} [description]
    */
   addCollaborator(username, permission='push') {
      return this._request('PUT', `/repos/${this.__fullname}/collaborators/${username}`, { permission });
   }

   /**
    * Get the contents of a repository
    * @see https://developer.github.com/v3/repos/contents/#get-contents
    * @param {string} ref - the ref to check
    * @param {string} path - the path containing the content to fetch
    * @param {string} type - either 'json', 'raw', or 'html'. Default is json
    * @return {Promise} - the promise for the http request
    */
   getContents(ref, path, type) {
      path = path ? `${encodeURI(path)}` : '';
      const option = { ref };
      let format = 'json';
      if (type === 'raw') {
         option.AcceptHeader = 'v3.raw';
         format = 'arraybuffer';
      } else if (type === 'html') {
         option.AcceptHeader = 'v3.html';
         format = 'text';
      }
      return this._request('GET', `/repos/${this.__fullname}/contents/${path}`, option, format);
   }

   /**
    * Get the README of a repository
    * @see https://developer.github.com/v3/repos/contents/#get-the-readme
    * @param {string} ref - the ref to check
    * @param {string} type - either 'json', 'raw', or 'html'. Default is json
    * @return {Promise} - the promise for the http request
    */
   getReadme(ref, type) {
      const option = { ref };
      let format = 'json';
      if (type === 'raw') {
         option.AcceptHeader = 'v3.raw';
         format = 'arraybuffer';
      } else if (type === 'html') {
         option.AcceptHeader = 'v3.html';
         format = 'text';
      }
      return this._request('GET', `/repos/${this.__fullname}/readme`, option, format);
   }

   /**
    * Fork a repository
    * @see https://developer.github.com/v3/repos/forks/#create-a-fork
    * @return {Promise} - the promise for the http request
    */
   fork() {
      return this._request('POST', `/repos/${this.__fullname}/forks`, null);
   }

   /**
    * List a repository's forks
    * @see https://developer.github.com/v3/repos/forks/#list-forks
    * @return {Promise} - the promise for the http request
    */
   listForks() {
      return this._request('GET', `/repos/${this.__fullname}/forks`, null);
   }

   /**
    * Create a new branch from an existing branch.
    * @param {string} [oldBranch=master] - the name of the existing branch
    * @param {string} newBranch - the name of the new branch
    * @return {Promise} - the promise for the http request
    */
   createBranch(oldBranch, newBranch) {
      newBranch = newBranch ? newBranch : oldBranch;

      return this.getRef(`heads/${oldBranch}`)
         .then((response) => {
            let sha = response.data.object.sha;
            return this.createRef({
               sha,
               ref: `refs/heads/${newBranch}`,
            });
         });
   }

   /**
    * Create a new pull request
    * @see https://developer.github.com/v3/pulls/#create-a-pull-request
    * @param {Object} options - the pull request description
    * @return {Promise} - the promise for the http request
    */
   createPullRequest(options) {
      return this._request('POST', `/repos/${this.__fullname}/pulls`, options);
   }

   /**
    * Update a pull request
    * @see https://developer.github.com/v3/pulls/#update-a-pull-request
    * @param {number|string} number - the number of the pull request to update
    * @param {Object} options - the pull request description
    * @return {Promise} - the promise for the http request
    */
   updatePullRequest(number, options) {
      return this._request('PATCH', `/repos/${this.__fullname}/pulls/${number}`, options);
   }

   /**
    * List the hooks for the repository
    * @see https://developer.github.com/v3/repos/hooks/#list-hooks
    * @return {Promise} - the promise for the http request
    */
   listHooks() {
      return this._request('GET', `/repos/${this.__fullname}/hooks`, null);
   }

   /**
    * Get a hook for the repository
    * @see https://developer.github.com/v3/repos/hooks/#get-single-hook
    * @param {number} id - the id of the webook
    * @return {Promise} - the promise for the http request
    */
   getHook(id) {
      return this._request('GET', `/repos/${this.__fullname}/hooks/${id}`, null);
   }

   /**
    * Add a new hook to the repository
    * @see https://developer.github.com/v3/repos/hooks/#create-a-hook
    * @param {Object} options - the configuration describing the new hook
    * @return {Promise} - the promise for the http request
    */
   createHook(options) {
      return this._request('POST', `/repos/${this.__fullname}/hooks`, options);
   }

   /**
    * Edit an existing webhook
    * @see https://developer.github.com/v3/repos/hooks/#edit-a-hook
    * @param {number} id - the id of the webhook
    * @param {Object} options - the new description of the webhook
    * @return {Promise} - the promise for the http request
    */
   updateHook(id, options) {
      return this._request('PATCH', `/repos/${this.__fullname}/hooks/${id}`, options);
   }

   /**
    * Delete a webhook
    * @see https://developer.github.com/v3/repos/hooks/#delete-a-hook
    * @param {number} id - the id of the webhook to be deleted
    * @return {Promise} - the promise for the http request
    */
   deleteHook(id) {
      return this._request('DELETE', `/repos/${this.__fullname}/hooks/${id}`, null);
   }

   /**
    * List the deploy keys for the repository
    * @see https://developer.github.com/v3/repos/keys/#list-deploy-keys
    * @return {Promise} - the promise for the http request
    */
   listKeys() {
      return this._request('GET', `/repos/${this.__fullname}/keys`, null);
   }

   /**
    * Get a deploy key for the repository
    * @see https://developer.github.com/v3/repos/keys/#get-a-deploy-key
    * @param {number} id - the id of the deploy key
    * @return {Promise} - the promise for the http request
    */
   getKey(id) {
      return this._request('GET', `/repos/${this.__fullname}/keys/${id}`, null);
   }

   /**
    * Add a new deploy key to the repository
    * @see https://developer.github.com/v3/repos/keys/#add-a-new-deploy-key
    * @param {Object} options - the configuration describing the new deploy key
    * @return {Promise} - the promise for the http request
    */
   createKey(options) {
      return this._request('POST', `/repos/${this.__fullname}/keys`, options);
   }

   /**
    * Delete a deploy key
    * @see https://developer.github.com/v3/repos/keys/#remove-a-deploy-key
    * @param {number} id - the id of the deploy key to be deleted
    * @return {Promise} - the promise for the http request
    */
   deleteKey(id) {
      return this._request('DELETE', `/repos/${this.__fullname}/keys/${id}`, null);
   }

   /**
    * Delete a file from a branch
    * @see https://developer.github.com/v3/repos/contents/#delete-a-file
    * @param {string} branch - the branch to delete from, or the default branch if not specified
    * @param {string} path - the path of the file to remove
    * @return {Promise} - the promise for the http request
    */
   deleteFile(branch, path) {
      return this.getContents(branch, path)
         .then((response) => {
            const deleteCommit = {
               message: `Delete file '${path}'`,
               sha: response.data.sha,
               branch,
            };
            return this._request('DELETE', `/repos/${this.__fullname}/contents/${path}`, deleteCommit);
         });
   }

   /**
    * Change all references in a repo from oldPath to new_path
    * @param {string} branch - the branch to carry out the reference change, or the default branch if not specified
    * @param {string} oldPath - original path
    * @param {string} newPath - new reference path
    * @return {Promise} - the promise for the http request
    */
   movePath(branch, oldPath, newPath) {
      let oldSha;
      return this.getRef(`heads/${branch}`)
         .then(({data: {object}}) => this.getTree(`${object.sha}?recursive=true`))
         .then(({data: {tree, sha}}) => {
            oldSha = sha;
            let newTree = tree.map((ref) => {
               if (ref.path === oldPath) {
                  ref.path = newPath;
               }
               if (ref.type === 'tree') {
                  delete ref.sha;
               }
               return ref;
            });
            return this.createTree(newTree);
         })
         .then(({data: tree}) => this.commit(oldSha, tree.sha, `Rename '${oldPath}' to '${newPath}'`))
         .then(({data: commit}) => this.updateHead(`heads/${branch}`, commit.sha, true));
   }

   /**
    * Write a file to the repository
    * @see https://developer.github.com/v3/repos/contents/#update-a-file
    * @param {string} branch - the name of the branch
    * @param {string} path - the path for the file
    * @param {string} message - the commit message
    * @param {string} content - the contents of the file
    * @param {Object} [options] - commit options
    * @param {Object} [options.author] - the author of the commit
    * @param {Object} [options.commiter] - the committer
    * @param {boolean} [options.encode] - true if the content should be base64 encoded
    * @return {Promise} - the promise for the http request
    */
   writeFile(branch, path, message, content, options = {}) {
      const filePath = path ? encodeURI(path) : '';
      const shouldEncode = options.encode !== false;
      delete options.encode;
      const commit = {
         branch,
         message,
         content: shouldEncode ? Base64.encode(content) : content,
      };
      Object.assign(commit, options);

      return this.getContents(branch, filePath)
         .then((response) => {
            commit.sha = response.data.sha;
            return this._request('PUT', `/repos/${this.__fullname}/contents/${filePath}`, commit);
         }, () => {
            return this._request('PUT', `/repos/${this.__fullname}/contents/${filePath}`, commit);
         });
   }

   /**
    * Check if a repository is starred by you
    * @see https://developer.github.com/v3/activity/starring/#check-if-you-are-starring-a-repository
    * @return {Promise} - the promise for the http request {Boolean} [description]
    */
   isStarred() {
      return this._request204or404('GET', `/user/starred/${this.__fullname}`, null);
   }

   /**
    * Star a repository
    * @see https://developer.github.com/v3/activity/starring/#star-a-repository
    * @return {Promise} - the promise for the http request
    */
   star() {
      return this._request('PUT', `/user/starred/${this.__fullname}`, null);
   }

   /**
    * Unstar a repository
    * @see https://developer.github.com/v3/activity/starring/#unstar-a-repository
    * @return {Promise} - the promise for the http request
    */
   unstar() {
      return this._request('DELETE', `/user/starred/${this.__fullname}`, null);
   }

   /**
    * Create a new release
    * @see https://developer.github.com/v3/repos/releases/#create-a-release
    * @param {Object} options - the description of the release
    * @return {Promise} - the promise for the http request
    */
   createRelease(options) {
      return this._request('POST', `/repos/${this.__fullname}/releases`, options);
   }

   /**
    * Edit a release
    * @see https://developer.github.com/v3/repos/releases/#edit-a-release
    * @param {string} id - the id of the release
    * @param {Object} options - the description of the release
    * @return {Promise} - the promise for the http request
    */
   updateRelease(id, options) {
      return this._request('PATCH', `/repos/${this.__fullname}/releases/${id}`, options);
   }

   /**
    * Get information about all releases
    * @see https://developer.github.com/v3/repos/releases/#list-releases-for-a-repository
    * @return {Promise} - the promise for the http request
    */
   listReleases() {
      return this._requestAllPages(`/repos/${this.__fullname}/releases`, null);
   }

   /**
    * Get information about a release
    * @see https://developer.github.com/v3/repos/releases/#get-a-single-release
    * @param {string} id - the id of the release
    * @return {Promise} - the promise for the http request
    */
   getRelease(id) {
      return this._request('GET', `/repos/${this.__fullname}/releases/${id}`, null);
   }

   /**
    * Delete a release
    * @see https://developer.github.com/v3/repos/releases/#delete-a-release
    * @param {string} id - the release to be deleted
    * @return {Promise} - the promise for the http request
    */
   deleteRelease(id) {
      return this._request('DELETE', `/repos/${this.__fullname}/releases/${id}`, null);
   }

   /**
    * Merge a pull request
    * @see https://developer.github.com/v3/pulls/#merge-a-pull-request-merge-button
    * @param {number|string} number - the number of the pull request to merge
    * @param {Object} options - the merge options for the pull request
    * @return {Promise} - the promise for the http request
    */
   mergePullRequest(number, options) {
      return this._request('PUT', `/repos/${this.__fullname}/pulls/${number}/merge`, options);
   }

   /**
    * Get information about all projects
    * @see https://developer.github.com/v3/projects/#list-repository-projects
    * @return {Promise} - the promise for the http request
    */
   listProjects() {
      return this._requestAllPages(`/repos/${this.__fullname}/projects`, {AcceptHeader: 'inertia-preview+json'});
   }

   /**
    * Create a new project
    * @see https://developer.github.com/v3/projects/#create-a-repository-project
    * @param {Object} options - the description of the project
    * @return {Promise} - the promise for the http request
    */
   createProject(options) {
      options = options || {};
      options.AcceptHeader = 'inertia-preview+json';
      return this._request('POST', `/repos/${this.__fullname}/projects`, options);
   }

   /**
    * Import from source
    * @see https://developer.github.com/v3/migrations/source_imports/
    * @param {Object} options - source info
    * @return {Promise} - the promise for the http request
    */
   importProject(options) {
      options = options || {};
      return this._request('PUT', `/repos/${this.__fullname}/import`, options);
   }

   /**
    * Watch a repository
    * @see https://developer.github.com/v3/activity/watching/#get-a-repository-subscription
    * @return {Promise} - the promise for the http request
    */
   watch() {
      return this._request('PUT', `/repos/${this.__fullname}/subscription`, { subscribed: true, ignored: false });
   }

   /**
    * Watch and ignore a repository
    * @see https://developer.github.com/v3/activity/watching/#get-a-repository-subscription
    * @return {Promise} - the promise for the http request
    */
   watchAndIgnore() {
      return this._request('PUT', `/repos/${this.__fullname}/subscription`, { subscribed: true, ignored: true });
   }

   /**
    * Unwatch a repository
    * @see https://developer.github.com/v3/activity/watching/#delete-a-repository-subscription
    * @return {Promise} - the promise for the http request
    */
   unwatch() {
      return this._request('DELETE', `/repos/${this.__fullname}/subscription`);
   }

   /**
    * Transfer the repo to new owner
    * @see https://developer.github.com/v3/repos/#transfer-a-repository
    * @param {Object} options - new owner
    * @return {Promise} - the promise for the http request
    */
   transferRepo(options) {
      options = options || {};
      return this._request('POST', `/repos/${this.__fullname}/transfer`, options);
   }

}

module.exports = Repository;

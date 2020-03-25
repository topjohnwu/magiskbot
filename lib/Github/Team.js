/**
 * @file
 * @copyright  2016 Matt Smith (Development Seed)
 * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
 *             Github.js is freely distributable.
 */

import Requestable from './Requestable';
import debug from 'debug';
const log = debug('github:team');

/**
 * A Team allows scoping of API requests to a particular Github Organization Team.
 */
class Team extends Requestable {
   /**
    * Create a Team.
    * @param {string} [teamId] - the id for the team
    * @param {Requestable.auth} [auth] - information required to authenticate to Github
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    */
   constructor(teamId, auth, apiBase) {
      super(auth, apiBase);
      this.__teamId = teamId;
   }

   /**
    * Get Team information
    * @see https://developer.github.com/v3/orgs/teams/#get-team
    * @return {Promise} - the promise for the http request
    */
   getTeam() {
      log(`Fetching Team ${this.__teamId}`);
      return this._request('Get', `/teams/${this.__teamId}`, undefined);
   }

   /**
    * List the Team's repositories
    * @see https://developer.github.com/v3/orgs/teams/#list-team-repos
    * @return {Promise} - the promise for the http request
    */
   listRepos() {
      log(`Fetching repositories for Team ${this.__teamId}`);
      return this._requestAllPages(`/teams/${this.__teamId}/repos`, undefined);
   }

   /**
    * Edit Team information
    * @see https://developer.github.com/v3/orgs/teams/#edit-team
    * @param {object} options - Parameters for team edit
    * @param {string} options.name - The name of the team
    * @param {string} [options.description] - Team description
    * @param {string} [options.repo_names] - Repos to add the team to
    * @param {string} [options.privacy=secret] - The level of privacy the team should have. Can be either one
    * of: `secret`, or `closed`
    * @return {Promise} - the promise for the http request
    */
   editTeam(options) {
      log(`Editing Team ${this.__teamId}`);
      return this._request('PATCH', `/teams/${this.__teamId}`, options);
   }

   /**
    * List the users who are members of the Team
    * @see https://developer.github.com/v3/orgs/teams/#list-team-members
    * @param {object} options - Parameters for listing team users
    * @param {string} [options.role=all] - can be one of: `all`, `maintainer`, or `member`
    * @return {Promise} - the promise for the http request
    */
   listMembers(options) {
      log(`Getting members of Team ${this.__teamId}`);
      return this._requestAllPages(`/teams/${this.__teamId}/members`, options);
   }

   /**
    * Get Team membership status for a user
    * @see https://developer.github.com/v3/orgs/teams/#get-team-membership
    * @param {string} username - can be one of: `all`, `maintainer`, or `member`
    * @return {Promise} - the promise for the http request
    */
   getMembership(username) {
      log(`Getting membership of user ${username} in Team ${this.__teamId}`);
      return this._request('GET', `/teams/${this.__teamId}/memberships/${username}`, undefined);
   }

   /**
    * Add a member to the Team
    * @see https://developer.github.com/v3/orgs/teams/#add-team-membership
    * @param {string} username - can be one of: `all`, `maintainer`, or `member`
    * @param {object} options - Parameters for adding a team member
    * @param {string} [options.role=member] - The role that this user should have in the team. Can be one
    * of: `member`, or `maintainer`
    * @return {Promise} - the promise for the http request
    */
   addMembership(username, options) {
      log(`Adding user ${username} to Team ${this.__teamId}`);
      return this._request('PUT', `/teams/${this.__teamId}/memberships/${username}`, options);
   }

   /**
    * Get repo management status for team
    * @see https://developer.github.com/v3/orgs/teams/#remove-team-membership
    * @param {string} owner - Organization name
    * @param {string} repo - Repo name
    * @return {Promise} - the promise for the http request
    */
   isManagedRepo(owner, repo) {
      log(`Getting repo management by Team ${this.__teamId} for repo ${owner}/${repo}`);
      return this._request204or404('GET', `/teams/${this.__teamId}/repos/${owner}/${repo}`, undefined);
   }

   /**
    * Add or Update repo management status for team
    * @see https://developer.github.com/v3/orgs/teams/#add-or-update-team-repository
    * @param {string} owner - Organization name
    * @param {string} repo - Repo name
    * @param {object} options - Parameters for adding or updating repo management for the team
    * @param {string} [options.permission] - The permission to grant the team on this repository. Can be one
    * of: `pull`, `push`, or `admin`
    * @return {Promise} - the promise for the http request
    */
   manageRepo(owner, repo, options) {
      log(`Adding or Updating repo management by Team ${this.__teamId} for repo ${owner}/${repo}`);
      return this._request204or404('PUT', `/teams/${this.__teamId}/repos/${owner}/${repo}`, options);
   }

   /**
    * Remove repo management status for team
    * @see https://developer.github.com/v3/orgs/teams/#remove-team-repository
    * @param {string} owner - Organization name
    * @param {string} repo - Repo name
    * @return {Promise} - the promise for the http request
    */
   unmanageRepo(owner, repo) {
      log(`Remove repo management by Team ${this.__teamId} for repo ${owner}/${repo}`);
      return this._request204or404('DELETE', `/teams/${this.__teamId}/repos/${owner}/${repo}`, undefined);
   }

   /**
    * Delete Team
    * @see https://developer.github.com/v3/orgs/teams/#delete-team
    * @return {Promise} - the promise for the http request
    */
   deleteTeam() {
      log(`Deleting Team ${this.__teamId}`);
      return this._request204or404('DELETE', `/teams/${this.__teamId}`, undefined);
   }
}

module.exports = Team;

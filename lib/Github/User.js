/**
 * @file
 * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
 * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
 *             Github.js is freely distributable.
 */

import Requestable from './Requestable';
import debug from 'debug';
const log = debug('github:user');

/**
 * A User allows scoping of API requests to a particular Github user.
 */
class User extends Requestable {
   /**
    * Create a User.
    * @param {string} [username] - the user to use for user-scoped queries
    * @param {Requestable.auth} [auth] - information required to authenticate to Github
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    */
   constructor(username, auth, apiBase) {
      super(auth, apiBase);
      this.__user = username;
   }

   /**
    * Get the url for the request. (dependent on if we're requesting for the authenticated user or not)
    * @private
    * @param {string} endpoint - the endpoint being requested
    * @return {string} - the resolved endpoint
    */
   __getScopedUrl(endpoint) {
      if (this.__user) {
         return endpoint ?
            `/users/${this.__user}/${endpoint}` :
            `/users/${this.__user}`
            ;

      } else { // eslint-disable-line
         switch (endpoint) {
            case '':
               return '/user';

            case 'notifications':
            case 'gists':
               return `/${endpoint}`;

            default:
               return `/user/${endpoint}`;
         }
      }
   }

   /**
    * List the user's repositories
    * @see https://developer.github.com/v3/repos/#list-user-repositories
    * @param {Object} [options={}] - any options to refine the search
    * @return {Promise} - the promise for the http request
    */
   listRepos(options = {}) {
      options = this._getOptionsWithDefaults(options);

      log(`Fetching repositories with options: ${JSON.stringify(options)}`);
      return this._requestAllPages(this.__getScopedUrl('repos'), options);
   }

   /**
    * List the orgs that the user belongs to
    * @see https://developer.github.com/v3/orgs/#list-user-organizations
    * @return {Promise} - the promise for the http request
    */
   listOrgs() {
      return this._request('GET', this.__getScopedUrl('orgs'), null);
   }

   /**
    * List the user's gists
    * @see https://developer.github.com/v3/gists/#list-a-users-gists
    * @return {Promise} - the promise for the http request
    */
   listGists() {
      return this._request('GET', this.__getScopedUrl('gists'), null);
   }

   /**
    * List the user's notifications
    * @see https://developer.github.com/v3/activity/notifications/#list-your-notifications
    * @param {Object} [options={}] - any options to refine the search
    * @return {Promise} - the promise for the http request
    */
   listNotifications(options = {}) {
      options.since = this._dateToISO(options.since);
      options.before = this._dateToISO(options.before);

      return this._request('GET', this.__getScopedUrl('notifications'), options);
   }

   /**
    * Show the user's profile
    * @see https://developer.github.com/v3/users/#get-a-single-user
    * @return {Promise} - the promise for the http request
    */
   getProfile() {
      return this._request('GET', this.__getScopedUrl(''), null);
   }

   /**
    * Gets the list of starred repositories for the user
    * @see https://developer.github.com/v3/activity/starring/#list-repositories-being-starred
    * @return {Promise} - the promise for the http request
    */
   listStarredRepos() {
      let requestOptions = this._getOptionsWithDefaults();
      return this._requestAllPages(this.__getScopedUrl('starred'), requestOptions);
   }

   /**
    * List email addresses for a user
    * @see https://developer.github.com/v3/users/emails/#list-email-addresses-for-a-user
    * @return {Promise} - the promise for the http request
    */
   getEmails() {
      return this._request('GET', '/user/emails', null);
   }

   /**
    * Have the authenticated user follow this user
    * @see https://developer.github.com/v3/users/followers/#follow-a-user
    * @param {string} username - the user to follow
    * @return {Promise} - the promise for the http request
    */
   follow(username) {
      return this._request('PUT', `/user/following/${this.__user}`, null);
   }

   /**
    * Have the currently authenticated user unfollow this user
    * @see https://developer.github.com/v3/users/followers/#follow-a-user
    * @param {string} username - the user to unfollow
    * @param {Requestable.callback} [cb] - receives true if the request succeeds
    * @return {Promise} - the promise for the http request
    */
   unfollow(username) {
      return this._request('DELETE', `/user/following/${this.__user}`, null);
   }

   /**
    * Create a new repository for the currently authenticated user
    * @see https://developer.github.com/v3/repos/#create
    * @param {object} options - the repository definition
    * @return {Promise} - the promise for the http request
    */
   createRepo(options) {
      return this._request('POST', '/user/repos', options);
   }
}

module.exports = User;

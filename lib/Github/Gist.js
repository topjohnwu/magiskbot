/**
 * @file
 * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
 * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
 *             Github.js is freely distributable.
 */

import Requestable from './Requestable';

/**
 * A Gist can retrieve and modify gists.
 */
class Gist extends Requestable {
   /**
    * Create a Gist.
    * @param {string} id - the id of the gist (not required when creating a gist)
    * @param {Requestable.auth} [auth] - information required to authenticate to Github
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    */
   constructor(id, auth, apiBase) {
      super(auth, apiBase);
      this.__id = id;
   }

   /**
    * Fetch a gist.
    * @see https://developer.github.com/v3/gists/#get-a-single-gist
    * @return {Promise} - the Promise for the http request
    */
   read() {
      return this._request('GET', `/gists/${this.__id}`, null);
   }

   /**
    * Create a new gist.
    * @see https://developer.github.com/v3/gists/#create-a-gist
    * @param {Object} gist - the data for the new gist
    * @return {Promise} - the Promise for the http request
    */
   create(gist) {
      return this._request('POST', '/gists', gist)
         .then((response) => {
            this.__id = response.data.id;
            return response;
         });
   }

   /**
    * Delete a gist.
    * @see https://developer.github.com/v3/gists/#delete-a-gist
    * @return {Promise} - the Promise for the http request
    */
   delete() {
      return this._request('DELETE', `/gists/${this.__id}`, null);
   }

   /**
    * Fork a gist.
    * @see https://developer.github.com/v3/gists/#fork-a-gist
    * @return {Promise} - the Promise for the http request
    */
   fork() {
      return this._request('POST', `/gists/${this.__id}/forks`, null);
   }

   /**
    * Update a gist.
    * @see https://developer.github.com/v3/gists/#edit-a-gist
    * @param {Object} gist - the new data for the gist
    * @return {Promise} - the Promise for the http request
    */
   update(gist) {
      return this._request('PATCH', `/gists/${this.__id}`, gist);
   }

   /**
    * Star a gist.
    * @see https://developer.github.com/v3/gists/#star-a-gist
    * @return {Promise} - the Promise for the http request
    */
   star() {
      return this._request('PUT', `/gists/${this.__id}/star`, null);
   }

   /**
    * Unstar a gist.
    * @see https://developer.github.com/v3/gists/#unstar-a-gist
    * @return {Promise} - the Promise for the http request
    */
   unstar() {
      return this._request('DELETE', `/gists/${this.__id}/star`, null);
   }

   /**
    * Check if a gist is starred by the user.
    * @see https://developer.github.com/v3/gists/#check-if-a-gist-is-starred
    * @return {Promise} - the Promise for the http request
    */
   isStarred() {
      return this._request204or404('GET', `/gists/${this.__id}/star`, null);
   }

   /**
    * List the gist's commits
    * @see https://developer.github.com/v3/gists/#list-gist-commits
    * @return {Promise} - the Promise for the http request
    */
   listCommits() {
      return this._requestAllPages(`/gists/${this.__id}/commits`, null);
   }

   /**
    * Fetch one of the gist's revision.
    * @see https://developer.github.com/v3/gists/#get-a-specific-revision-of-a-gist
    * @param {string} revision - the id of the revision
    * @return {Promise} - the Promise for the http request
    */
   getRevision(revision) {
      return this._request('GET', `/gists/${this.__id}/${revision}`, null);
   }

   /**
    * List the gist's comments
    * @see https://developer.github.com/v3/gists/comments/#list-comments-on-a-gist
    * @return {Promise} - the promise for the http request
    */
   listComments() {
      return this._requestAllPages(`/gists/${this.__id}/comments`, null);
   }

   /**
    * Fetch one of the gist's comments
    * @see https://developer.github.com/v3/gists/comments/#get-a-single-comment
    * @param {number} comment - the id of the comment
    * @return {Promise} - the Promise for the http request
    */
   getComment(comment) {
      return this._request('GET', `/gists/${this.__id}/comments/${comment}`, null);
   }

   /**
    * Comment on a gist
    * @see https://developer.github.com/v3/gists/comments/#create-a-comment
    * @param {string} comment - the comment to add
    * @return {Promise} - the Promise for the http request
    */
   createComment(comment) {
      return this._request('POST', `/gists/${this.__id}/comments`, {body: comment});
   }

   /**
    * Edit a comment on the gist
    * @see https://developer.github.com/v3/gists/comments/#edit-a-comment
    * @param {number} comment - the id of the comment
    * @param {string} body - the new comment
    * @return {Promise} - the promise for the http request
    */
   editComment(comment, body) {
      return this._request('PATCH', `/gists/${this.__id}/comments/${comment}`, {body: body});
   }

   /**
    * Delete a comment on the gist.
    * @see https://developer.github.com/v3/gists/comments/#delete-a-comment
    * @param {number} comment - the id of the comment
    * @return {Promise} - the Promise for the http request
    */
   deleteComment(comment) {
      return this._request('DELETE', `/gists/${this.__id}/comments/${comment}`, null);
   }
}

module.exports = Gist;

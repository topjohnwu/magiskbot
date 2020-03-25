/**
 * @file
 * @copyright  2013 Michael Aufreiter (Development Seed) and 2016 Yahoo Inc.
 * @license    Licensed under {@link https://spdx.org/licenses/BSD-3-Clause-Clear.html BSD-3-Clause-Clear}.
 *             Github.js is freely distributable.
 */

import Requestable from './Requestable';

/**
 * Issue wraps the functionality to get issues for repositories
 */
class Issue extends Requestable {
   /**
    * Create a new Issue
    * @param {string} repository - the full name of the repository (`:user/:repo`) to get issues for
    * @param {Requestable.auth} [auth] - information required to authenticate to Github
    * @param {string} [apiBase=https://api.github.com] - the base Github API URL
    */
   constructor(repository, auth, apiBase) {
      super(auth, apiBase);
      this.__repository = repository;
   }

   /**
    * Create a new issue
    * @see https://developer.github.com/v3/issues/#create-an-issue
    * @param {Object} issueData - the issue to create
    * @return {Promise} - the promise for the http request
    */
   createIssue(issueData) {
      return this._request('POST', `/repos/${this.__repository}/issues`, issueData);
   }

   /**
    * List the issues for the repository
    * @see https://developer.github.com/v3/issues/#list-issues-for-a-repository
    * @param {Object} options - filtering options
    * @return {Promise} - the promise for the http request
    */
   listIssues(options) {
      return this._requestAllPages(`/repos/${this.__repository}/issues`, options);
   }

   /**
    * List the events for an issue
    * @see https://developer.github.com/v3/issues/events/#list-events-for-an-issue
    * @param {number} issue - the issue to get events for
    * @return {Promise} - the promise for the http request
    */
   listIssueEvents(issue) {
      return this._request('GET', `/repos/${this.__repository}/issues/${issue}/events`, null);
   }

   /**
    * List comments on an issue
    * @see https://developer.github.com/v3/issues/comments/#list-comments-on-an-issue
    * @param {number} issue - the id of the issue to get comments from
    * @return {Promise} - the promise for the http request
    */
   listIssueComments(issue) {
      return this._request('GET', `/repos/${this.__repository}/issues/${issue}/comments`, null);
   }

   /**
    * Get a single comment on an issue
    * @see https://developer.github.com/v3/issues/comments/#get-a-single-comment
    * @param {number} id - the comment id to get
    * @return {Promise} - the promise for the http request
    */
   getIssueComment(id) {
      return this._request('GET', `/repos/${this.__repository}/issues/comments/${id}`, null);
   }

   /**
    * Comment on an issue
    * @see https://developer.github.com/v3/issues/comments/#create-a-comment
    * @param {number} issue - the id of the issue to comment on
    * @param {string} comment - the comment to add
    * @return {Promise} - the promise for the http request
    */
   createIssueComment(issue, comment) {
      return this._request('POST', `/repos/${this.__repository}/issues/${issue}/comments`, {body: comment});
   }

   /**
    * Edit a comment on an issue
    * @see https://developer.github.com/v3/issues/comments/#edit-a-comment
    * @param {number} id - the comment id to edit
    * @param {string} comment - the comment to edit
    * @return {Promise} - the promise for the http request
    */
   editIssueComment(id, comment) {
      return this._request('PATCH', `/repos/${this.__repository}/issues/comments/${id}`, {body: comment});
   }

   /**
    * Delete a comment on an issue
    * @see https://developer.github.com/v3/issues/comments/#delete-a-comment
    * @param {number} id - the comment id to delete
    * @return {Promise} - the promise for the http request
    */
   deleteIssueComment(id) {
      return this._request('DELETE', `/repos/${this.__repository}/issues/comments/${id}`, null);
   }

   /**
    * Edit an issue
    * @see https://developer.github.com/v3/issues/#edit-an-issue
    * @param {number} issue - the issue number to edit
    * @param {Object} issueData - the new issue data
    * @return {Promise} - the promise for the http request
    */
   editIssue(issue, issueData) {
      return this._request('PATCH', `/repos/${this.__repository}/issues/${issue}`, issueData);
   }

   /**
    * Get a particular issue
    * @see https://developer.github.com/v3/issues/#get-a-single-issue
    * @param {number} issue - the issue number to fetch
    * @return {Promise} - the promise for the http request
    */
   getIssue(issue) {
      return this._request('GET', `/repos/${this.__repository}/issues/${issue}`, null);
   }

   /**
    * List the milestones for the repository
    * @see https://developer.github.com/v3/issues/milestones/#list-milestones-for-a-repository
    * @param {Object} options - filtering options
    * @return {Promise} - the promise for the http request
    */
   listMilestones(options) {
      return this._request('GET', `/repos/${this.__repository}/milestones`, options);
   }

   /**
    * Get a milestone
    * @see https://developer.github.com/v3/issues/milestones/#get-a-single-milestone
    * @param {string} milestone - the id of the milestone to fetch
    * @return {Promise} - the promise for the http request
    */
   getMilestone(milestone) {
      return this._request('GET', `/repos/${this.__repository}/milestones/${milestone}`, null);
   }

   /**
    * Create a new milestone
    * @see https://developer.github.com/v3/issues/milestones/#create-a-milestone
    * @param {Object} milestoneData - the milestone definition
    * @return {Promise} - the promise for the http request
    */
   createMilestone(milestoneData) {
      return this._request('POST', `/repos/${this.__repository}/milestones`, milestoneData);
   }

   /**
    * Edit a milestone
    * @see https://developer.github.com/v3/issues/milestones/#update-a-milestone
    * @param {string} milestone - the id of the milestone to edit
    * @param {Object} milestoneData - the updates to make to the milestone
    * @return {Promise} - the promise for the http request
    */
   editMilestone(milestone, milestoneData) {
      return this._request('PATCH', `/repos/${this.__repository}/milestones/${milestone}`, milestoneData);
   }

   /**
    * Delete a milestone (this is distinct from closing a milestone)
    * @see https://developer.github.com/v3/issues/milestones/#delete-a-milestone
    * @param {string} milestone - the id of the milestone to delete
    * @return {Promise} - the promise for the http request
    */
   deleteMilestone(milestone) {
      return this._request('DELETE', `/repos/${this.__repository}/milestones/${milestone}`, null);
   }

   /**
    * Create a new label
    * @see https://developer.github.com/v3/issues/labels/#create-a-label
    * @param {Object} labelData - the label definition
    * @return {Promise} - the promise for the http request
    */
   createLabel(labelData) {
      return this._request('POST', `/repos/${this.__repository}/labels`, labelData);
   }

  /**
   * List the labels for the repository
   * @see https://developer.github.com/v3/issues/labels/#list-all-labels-for-this-repository
   * @param {Object} options - filtering options
   * @return {Promise} - the promise for the http request
   */
   listLabels(options) {
      return this._request('GET', `/repos/${this.__repository}/labels`, options);
   }

  /**
   * Get a label
   * @see https://developer.github.com/v3/issues/labels/#get-a-single-label
   * @param {string} label - the name of the label to fetch
   * @return {Promise} - the promise for the http request
   */
   getLabel(label) {
      return this._request('GET', `/repos/${this.__repository}/labels/${label}`, null);
   }

  /**
   * Edit a label
   * @see https://developer.github.com/v3/issues/labels/#update-a-label
   * @param {string} label - the name of the label to edit
   * @param {Object} labelData - the updates to make to the label
   * @return {Promise} - the promise for the http request
   */
   editLabel(label, labelData) {
      return this._request('PATCH', `/repos/${this.__repository}/labels/${label}`, labelData);
   }

  /**
   * Delete a label
   * @see https://developer.github.com/v3/issues/labels/#delete-a-label
   * @param {string} label - the name of the label to delete
   * @return {Promise} - the promise for the http request
   */
   deleteLabel(label) {
      return this._request('DELETE', `/repos/${this.__repository}/labels/${label}`, null);
   }
}

module.exports = Issue;

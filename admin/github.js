/* ============================================================
   ByJooy Studio - talking to GitHub

   Everything the dashboard saves becomes one commit on the site's
   repository. No server sits in between.
   ============================================================ */
(function () {
  'use strict';

  var API = 'https://api.github.com';

  function GH(cfg, token) {
    this.owner = cfg.REPO_OWNER;
    this.repo = cfg.REPO_NAME;
    this.branch = cfg.REPO_BRANCH || 'main';
    this.token = token;
  }

  GH.prototype.req = function (path, opts) {
    opts = opts || {};
    return fetch(API + path, {
      method: opts.method || 'GET',
      headers: {
        'Authorization': 'Bearer ' + this.token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (r.status === 204) return null;
      return r.json().then(function (j) {
        if (!r.ok) {
          var m = j && j.message ? j.message : 'GitHub returned ' + r.status;
          if (r.status === 401) m = 'That token was rejected. Check it was copied in full.';
          if (r.status === 403) m = 'That token does not have permission to write to this repository.';
          if (r.status === 404) m = 'Repository not found, or the token cannot see it.';
          var e = new Error(m);
          e.status = r.status;
          throw e;
        }
        return j;
      });
    });
  };

  /* ---- who am I, and can I write here ---- */
  GH.prototype.check = function () {
    var self = this;
    return this.req('/user').then(function (user) {
      return self.req('/repos/' + self.owner + '/' + self.repo).then(function (repo) {
        if (!repo.permissions || !repo.permissions.push) {
          throw new Error('That token can read the repository but not write to it. ' +
                          'It needs Contents: Read and write.');
        }
        return { login: user.login, repo: repo.full_name };
      });
    });
  };

  /* ---- read the catalogue ---- */
  GH.prototype.readJson = function (path) {
    var self = this;
    return this.req('/repos/' + this.owner + '/' + this.repo + '/contents/' +
                    path + '?ref=' + this.branch)
      .then(function (f) {
        // content comes back base64 with newlines in it
        var txt = decodeURIComponent(escape(atob(f.content.replace(/\n/g, ''))));
        return JSON.parse(txt);
      })
      .catch(function (e) {
        if (e.status === 404) return null;
        throw e;
      });
  };

  /* ------------------------------------------------------------
     Commit several files at once.

     files: [{ path, content }] where content is either a string
            or { base64: '...' } for binary.
     Uses the git data API so photos and the catalogue land in a
     single commit instead of one commit per file.
     ------------------------------------------------------------ */
  GH.prototype.commit = function (files, message, onStep) {
    var self = this;
    var ref = 'heads/' + this.branch;
    var step = onStep || function () {};
    var baseCommit, baseTree;

    step('Reading the repository');

    return this.req('/repos/' + this.owner + '/' + this.repo + '/git/ref/' + ref)
      .then(function (r) {
        baseCommit = r.object.sha;
        return self.req('/repos/' + self.owner + '/' + self.repo + '/git/commits/' + baseCommit);
      })
      .then(function (c) {
        baseTree = c.tree.sha;

        // upload each file as a blob, in sequence so progress is honest
        var blobs = [];
        var chain = Promise.resolve();
        files.forEach(function (f, i) {
          chain = chain.then(function () {
            step('Uploading ' + (i + 1) + ' of ' + files.length);
            var body = f.content && f.content.base64
              ? { content: f.content.base64, encoding: 'base64' }
              : { content: String(f.content), encoding: 'utf-8' };
            return self.req('/repos/' + self.owner + '/' + self.repo + '/git/blobs', {
              method: 'POST', body: body
            }).then(function (b) {
              blobs.push({ path: f.path, mode: '100644', type: 'blob', sha: b.sha });
            });
          });
        });
        return chain.then(function () { return blobs; });
      })
      .then(function (blobs) {
        step('Saving');
        return self.req('/repos/' + self.owner + '/' + self.repo + '/git/trees', {
          method: 'POST',
          body: { base_tree: baseTree, tree: blobs }
        });
      })
      .then(function (tree) {
        return self.req('/repos/' + self.owner + '/' + self.repo + '/git/commits', {
          method: 'POST',
          body: { message: message, tree: tree.sha, parents: [baseCommit] }
        });
      })
      .then(function (commit) {
        return self.req('/repos/' + self.owner + '/' + self.repo + '/git/refs/' + ref, {
          method: 'PATCH',
          body: { sha: commit.sha }
        });
      })
      .then(function () {
        step('Published');
        return true;
      });
  };

  window.ByJooyGitHub = GH;
})();

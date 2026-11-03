/* ============================================================
   ByJooy Studio

   Edits are written straight to the site's GitHub repository as a
   single commit, then GitHub Pages republishes. There is no server.
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.BYJOOY_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'byjooy.token';

  var gh = null;
  var rows = [];        // the catalogue
  var editing = null;   // row being edited, or null for new
  var shots = [];       // [{name} existing | {name, full, thumb, preview} new]
  var dragFrom = null;

  /* ---------- helpers ---------- */

  // Catalogue text is typed by a person and read back out of a file, so it
  // never goes into markup raw. This page holds the access key, and a stray
  // tag in a product field would be the one way to reach it.
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function naira(n) { return '₦' + Number(n || 0).toLocaleString('en-NG'); }

  function priceLabel(r) {
    return r.priceHigh ? naira(r.priceLow) + ' - ' + naira(r.priceHigh) : naira(r.priceLow);
  }

  function slugify(s) {
    return String(s).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'piece';
  }

  function imgUrl(slug, name, thumb) {
    return '../' + CFG.IMAGE_DIR + '/' + slug + '/' + (thumb ? 'thumb/' : '') + name;
  }

  var toastTimer;
  function toast(msg, bad) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.toggle('is-bad', !!bad);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3600);
  }

  function showErr(id, msg) {
    var n = $(id);
    if (!msg) { n.hidden = true; return; }
    n.textContent = msg;
    n.hidden = false;
  }

  /* ============================================================
     BOOT
     ============================================================ */
  if (!CFG.REPO_OWNER || !CFG.REPO_NAME) {
    $('gateSetup').hidden = false;
    return;
  }
  if (!window.ByJooyImages.webpSupported()) {
    $('gateSetup').hidden = false;
    $('gateSetup').querySelector('h1').textContent = 'This browser is too old';
    $('gateSetup').querySelector('p').textContent =
      'Studio needs a current browser to prepare photos. Please use Chrome, Edge, Safari or Firefox.';
    return;
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }

  if (saved) {
    gh = new window.ByJooyGitHub(CFG, saved);
    gh.check().then(enterApp).catch(function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      $('gateLogin').hidden = false;
    });
  } else {
    $('gateLogin').hidden = false;
  }

  /* ============================================================
     SIGN IN
     ============================================================ */
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    showErr('loginErr', '');
    var token = $('token').value.trim();
    if (!token) return;

    var btn = $('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Checking';

    var probe = new window.ByJooyGitHub(CFG, token);
    probe.check().then(function (who) {
      if ($('remember').checked) {
        try { localStorage.setItem(KEY, token); } catch (e) {}
      }
      gh = probe;
      btn.disabled = false;
      btn.textContent = 'Sign in';
      $('gateLogin').hidden = true;
      enterApp(who);
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = 'Sign in';
      showErr('loginErr', err.message);
    });
  });

  $('signOut').addEventListener('click', function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  });

  function enterApp(who) {
    $('gateLogin').hidden = true;
    $('app').hidden = false;
    if (who && who.login) $('whoami').textContent = who.login;
    load();
  }

  /* ============================================================
     LOAD + RENDER
     ============================================================ */
  function load() {
    $('list').innerHTML = '<p class="loading">Loading the catalogue</p>';
    gh.readJson(CFG.DATA_PATH).then(function (data) {
      rows = Array.isArray(data) ? data : (window.BYJOOY_PRODUCTS || []);
      render();
    }).catch(function (err) {
      $('list').innerHTML = '';
      toast(err.message, true);
    });
  }

  function render() {
    var list = $('list');
    list.innerHTML = '';

    var photos = 0, hidden = 0;
    rows.forEach(function (r) {
      photos += (r.images || []).length;
      if (r.hidden) hidden++;
    });
    $('statStyles').textContent = rows.length;
    $('statPhotos').textContent = photos;
    $('statHidden').textContent = hidden;
    $('empty').hidden = rows.length > 0;

    rows.forEach(function (r, i) {
      var cover = (r.images && r.images[0]) ? esc(imgUrl(r.slug, r.images[0], true)) : '';
      var card = document.createElement('article');
      card.className = 'item';
      card.innerHTML =
        '<div class="item__media">' +
          (cover ? '<img src="' + cover + '" alt="" loading="lazy">' : '') +
          (r.hidden ? '<span class="item__hidden">Hidden</span>' : '') +
          '<span class="item__count">' + (r.images || []).length + ' photos</span>' +
        '</div>' +
        '<div class="item__body">' +
          '<span class="item__name"></span>' +
          '<span class="item__meta">Sizes ' + esc(r.sizes) + ' &middot; ' + esc(r.tag) + '</span>' +
          '<span class="item__price">' + priceLabel(r) + '</span>' +
          '<div class="item__row">' +
            '<button class="btn btn--ghost" data-act="edit">Edit</button>' +
            '<button class="btn btn--ghost" data-act="vis">' + (r.hidden ? 'Show' : 'Hide') + '</button>' +
          '</div>' +
          '<div class="item__row">' +
            '<button class="btn btn--ghost" data-act="up"' + (i === 0 ? ' disabled' : '') + '>Move up</button>' +
            '<button class="btn btn--ghost" data-act="down"' + (i === rows.length - 1 ? ' disabled' : '') + '>Move down</button>' +
          '</div>' +
        '</div>';
      card.querySelector('.item__name').textContent = r.name;

      card.querySelector('[data-act=edit]').addEventListener('click', function () { openForm(r); });
      card.querySelector('[data-act=vis]').addEventListener('click', function () {
        r.hidden = !r.hidden;
        publish([], (r.hidden ? 'hide ' : 'show ') + r.name);
      });
      card.querySelector('[data-act=up]').addEventListener('click', function () { move(i, -1); });
      card.querySelector('[data-act=down]').addEventListener('click', function () { move(i, 1); });
      list.appendChild(card);
    });
  }

  function move(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= rows.length) return;
    var tmp = rows[i]; rows[i] = rows[j]; rows[j] = tmp;
    render();
    publish([], 'reorder the collection');
  }

  /* ============================================================
     PUBLISH - write files and the catalogue in one commit
     ============================================================ */
  var busy = false;
  function publish(files, what) {
    if (busy) return Promise.resolve();
    busy = true;

    var bar = $('pubBar');
    bar.hidden = false;
    $('pubTxt').textContent = 'Preparing';

    var all = files.concat([{
      path: CFG.DATA_PATH,
      content: JSON.stringify(rows, null, 2) + '\n'
    }]);

    return gh.commit(all, 'studio: ' + what, function (s) {
      $('pubTxt').textContent = s;
    }).then(function () {
      busy = false;
      bar.hidden = true;
      toast('Saved. The website updates in a minute or two.');
      return true;
    }).catch(function (err) {
      busy = false;
      bar.hidden = true;
      toast(err.message, true);
      throw err;
    });
  }

  /* ============================================================
     EDITOR
     ============================================================ */
  function openForm(r) {
    editing = r || null;
    shots = [];

    $('formTitle').textContent = r ? 'Edit piece' : 'New piece';
    $('fName').value = r ? r.name : '';
    $('fPriceLow').value = r ? r.priceLow : '';
    $('fPriceHigh').value = r && r.priceHigh ? r.priceHigh : '';
    $('fSizes').value = r ? r.sizes : '6 - 18';
    $('fTag').value = r ? r.tag : 'Core';
    $('fNote').value = r ? (r.note || '') : '';
    $('fHidden').checked = r ? !!r.hidden : false;
    $('deleteBtn').hidden = !r;
    showErr('formErr', '');

    if (r && r.images) {
      r.images.forEach(function (n) { shots.push({ name: n, slug: r.slug }); });
    }
    paintShots();

    $('sheet').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeForm() {
    $('sheet').hidden = true;
    document.body.style.overflow = '';
    shots = [];
    editing = null;
  }

  $('newBtn').addEventListener('click', function () { openForm(null); });
  $('formClose').addEventListener('click', closeForm);
  $('cancelBtn').addEventListener('click', closeForm);
  $('sheetScrim').addEventListener('click', closeForm);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('sheet').hidden) closeForm();
  });

  /* ---------- photos ---------- */
  function paintShots() {
    var wrap = $('shots');
    wrap.innerHTML = '';
    shots.forEach(function (s, i) {
      var url = s.preview || imgUrl(s.slug, s.name, true);
      var d = document.createElement('div');
      d.className = 'shot';
      d.draggable = true;
      d.innerHTML =
        '<img src="' + url + '" alt="">' +
        (i === 0 ? '<span class="shot__cover">Cover</span>' : '') +
        '<span class="shot__n">' + (i + 1) + '</span>' +
        '<button class="shot__x" type="button" aria-label="Remove">&times;</button>';

      d.querySelector('.shot__x').addEventListener('click', function (e) {
        e.stopPropagation();
        shots.splice(i, 1);
        paintShots();
      });
      d.addEventListener('dragstart', function () { d.classList.add('is-drag'); dragFrom = i; });
      d.addEventListener('dragend', function () { d.classList.remove('is-drag'); });
      d.addEventListener('dragover', function (e) { e.preventDefault(); });
      d.addEventListener('drop', function (e) {
        e.preventDefault();
        if (dragFrom === null || dragFrom === i) return;
        shots.splice(i, 0, shots.splice(dragFrom, 1)[0]);
        dragFrom = null;
        paintShots();
      });
      wrap.appendChild(d);
    });
  }

  function addFiles(files) {
    var imgs = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type); });
    if (!imgs.length) return;

    var prep = $('prepping');
    prep.hidden = false;
    var done = 0;
    prep.textContent = 'Preparing photos, 0 of ' + imgs.length;

    var chain = Promise.resolve();
    imgs.forEach(function (f) {
      chain = chain.then(function () {
        return window.ByJooyImages.prepare(f).then(function (out) {
          shots.push({ full: out.full, thumb: out.thumb, preview: out.preview });
          done++;
          prep.textContent = 'Preparing photos, ' + done + ' of ' + imgs.length;
          paintShots();
        }).catch(function () { done++; });
      });
    });

    chain.then(function () {
      prep.hidden = true;
      paintShots();
    });
  }

  $('pickBtn').addEventListener('click', function () { $('fFiles').click(); });
  $('fFiles').addEventListener('change', function (e) { addFiles(e.target.files); e.target.value = ''; });

  var drop = $('drop');
  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
  });
  drop.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  /* ---------- save ---------- */
  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    showErr('formErr', '');
    if (!shots.length) { showErr('formErr', 'Add at least one photo.'); return; }

    var name = $('fName').value.trim();
    var slug = editing ? editing.slug : uniqueSlug(slugify(name));
    var files = [];
    var names = [];

    shots.forEach(function (s, i) {
      if (s.name && s.slug === slug) { names.push(s.name); return; }
      // new upload, or a photo carried over from a renamed piece
      var fname = slug + '-' + (i + 1) + '-' + Date.now().toString(36) +
                  Math.random().toString(36).slice(2, 5) + '.webp';
      names.push(fname);
      if (s.full) {
        files.push({ path: CFG.IMAGE_DIR + '/' + slug + '/' + fname,
                     content: { base64: s.full } });
        files.push({ path: CFG.IMAGE_DIR + '/' + slug + '/thumb/' + fname,
                     content: { base64: s.thumb } });
      } else {
        names.pop();
        names.push(s.name);
      }
    });

    var row = {
      slug: slug,
      name: name,
      tag: $('fTag').value,
      priceLow: parseInt($('fPriceLow').value, 10) || 0,
      priceHigh: $('fPriceHigh').value ? parseInt($('fPriceHigh').value, 10) : 0,
      sizes: $('fSizes').value.trim(),
      note: $('fNote').value.trim(),
      images: names,
      hidden: $('fHidden').checked
    };

    if (editing) {
      rows[rows.indexOf(editing)] = row;
    } else {
      rows.push(row);
    }

    $('saveBtn').disabled = true;
    publish(files, (editing ? 'update ' : 'add ') + name)
      .then(function () {
        $('saveBtn').disabled = false;
        closeForm();
        render();
      })
      .catch(function () {
        $('saveBtn').disabled = false;
        load();
      });
  });

  function uniqueSlug(base) {
    var taken = {};
    rows.forEach(function (r) { taken[r.slug] = true; });
    if (!taken[base]) return base;
    var n = 2;
    while (taken[base + '-' + n]) n++;
    return base + '-' + n;
  }

  /* ---------- delete ---------- */
  $('deleteBtn').addEventListener('click', function () {
    if (!editing) return;
    if (!confirm('Remove "' + editing.name + '" from the website?\n\n' +
                 'The photos stay in the repository, so this can be undone.')) return;
    rows.splice(rows.indexOf(editing), 1);
    publish([], 'remove ' + editing.name).then(function () {
      closeForm();
      render();
    }).catch(function () { load(); });
  });
})();

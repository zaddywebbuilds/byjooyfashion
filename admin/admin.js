/* ============================================================
   ByJooy Studio - add and edit pieces
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.BYJOOY_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  var sb = null;
  var rows = [];
  var editing = null;   // the row being edited, or null for a new one
  var shots = [];       // [{url} | {file, preview}]
  var videoFile = null;
  var videoUrl = null;

  /* ---------- small helpers ---------- */
  function naira(n) { return '₦' + Number(n || 0).toLocaleString('en-NG'); }

  function priceLabel(r) {
    return r.price_high ? naira(r.price_low) + ' - ' + naira(r.price_high) : naira(r.price_low);
  }

  function slugify(s) {
    return String(s).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'piece';
  }

  var toastTimer;
  function toast(msg, bad) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.toggle('is-bad', !!bad);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  function showErr(nodeId, msg) {
    var n = $(nodeId);
    if (!msg) { n.hidden = true; return; }
    n.textContent = msg;
    n.hidden = false;
  }

  /* ============================================================
     BOOT
     ============================================================ */
  if (!CFG.isConnected || !CFG.isConnected()) {
    $('gateSetup').hidden = false;
    return;
  }

  sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

  sb.auth.getSession().then(function (res) {
    if (res.data && res.data.session) enterApp();
    else $('gateLogin').hidden = false;
  });

  /* ============================================================
     AUTH
     ============================================================ */
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    showErr('loginErr', '');
    var btn = $('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Signing in';

    sb.auth.signInWithPassword({
      email: $('email').value.trim(),
      password: $('password').value
    }).then(function (res) {
      btn.disabled = false;
      btn.textContent = 'Sign in';
      if (res.error) { showErr('loginErr', res.error.message); return; }
      $('gateLogin').hidden = true;
      enterApp();
    });
  });

  $('signOut').addEventListener('click', function () {
    sb.auth.signOut().then(function () { location.reload(); });
  });

  function enterApp() {
    $('gateLogin').hidden = true;
    $('app').hidden = false;
    load();
  }

  /* ============================================================
     LOAD + RENDER
     ============================================================ */
  function load() {
    sb.from('products').select('*').order('position').order('created_at')
      .then(function (res) {
        if (res.error) { toast(res.error.message, true); return; }
        rows = res.data || [];
        render();
      });
  }

  function render() {
    var list = $('list');
    list.innerHTML = '';

    var photos = 0, hidden = 0;
    rows.forEach(function (r) {
      photos += (r.images || []).length;
      if (!r.published) hidden++;
    });
    $('statStyles').textContent = rows.length;
    $('statPhotos').textContent = photos;
    $('statHidden').textContent = hidden;
    $('empty').hidden = rows.length > 0;

    rows.forEach(function (r) {
      var cover = (r.images && r.images[0]) || '';
      var card = document.createElement('article');
      card.className = 'item';
      card.innerHTML =
        '<div class="item__media">' +
          (cover ? '<img src="' + cover + '" alt="" loading="lazy">' : '') +
          (r.published ? '' : '<span class="item__hidden">Hidden</span>') +
          '<span class="item__count">' + (r.images || []).length + ' photos</span>' +
        '</div>' +
        '<div class="item__body">' +
          '<span class="item__name"></span>' +
          '<span class="item__meta">Sizes ' + r.sizes + ' &middot; ' + r.tag + '</span>' +
          '<span class="item__price">' + priceLabel(r) + '</span>' +
          '<div class="item__row">' +
            '<button class="btn btn--ghost" data-act="edit">Edit</button>' +
            '<button class="btn btn--ghost" data-act="vis">' +
              (r.published ? 'Hide' : 'Show') +
            '</button>' +
          '</div>' +
        '</div>';
      // name via textContent so a quote in the name cannot break the markup
      card.querySelector('.item__name').textContent = r.name;

      card.querySelector('[data-act=edit]').addEventListener('click', function () { openForm(r); });
      card.querySelector('[data-act=vis]').addEventListener('click', function () { toggleVis(r); });
      list.appendChild(card);
    });
  }

  function toggleVis(r) {
    sb.from('products').update({ published: !r.published }).eq('id', r.id)
      .then(function (res) {
        if (res.error) { toast(res.error.message, true); return; }
        toast(r.published ? 'Hidden from the site' : 'Now showing on the site');
        load();
      });
  }

  /* ============================================================
     EDITOR
     ============================================================ */
  function openForm(r) {
    editing = r || null;
    shots = [];
    videoFile = null;
    videoUrl = r ? (r.video_url || null) : null;

    $('formTitle').textContent = r ? 'Edit piece' : 'New piece';
    $('fName').value = r ? r.name : '';
    $('fPriceLow').value = r ? r.price_low : '';
    $('fPriceHigh').value = r && r.price_high ? r.price_high : '';
    $('fSizes').value = r ? r.sizes : '6 - 18';
    $('fTag').value = r ? r.tag : 'Core';
    $('fNote').value = r ? (r.note || '') : '';
    $('fPublished').checked = r ? !!r.published : true;
    $('deleteBtn').hidden = !r;
    $('videoName').textContent = videoUrl ? 'video attached' : 'none';
    showErr('formErr', '');
    $('prog').hidden = true;

    if (r && r.images) r.images.forEach(function (u) { shots.push({ url: u }); });
    paintShots();

    $('sheet').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeForm() {
    $('sheet').hidden = true;
    document.body.style.overflow = '';
    shots.forEach(function (s) { if (s.preview) URL.revokeObjectURL(s.preview); });
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
      var d = document.createElement('div');
      d.className = 'shot';
      d.draggable = true;
      d.dataset.i = i;
      d.innerHTML =
        '<img src="' + (s.url || s.preview) + '" alt="">' +
        (i === 0 ? '<span class="shot__cover">Cover</span>' : '') +
        '<span class="shot__n">' + (i + 1) + '</span>' +
        '<button class="shot__x" type="button" aria-label="Remove">&times;</button>';

      d.querySelector('.shot__x').addEventListener('click', function (e) {
        e.stopPropagation();
        if (shots[i].preview) URL.revokeObjectURL(shots[i].preview);
        shots.splice(i, 1);
        paintShots();
      });

      d.addEventListener('dragstart', function () {
        d.classList.add('is-drag');
        dragFrom = i;
      });
      d.addEventListener('dragend', function () { d.classList.remove('is-drag'); });
      d.addEventListener('dragover', function (e) { e.preventDefault(); });
      d.addEventListener('drop', function (e) {
        e.preventDefault();
        if (dragFrom === null || dragFrom === i) return;
        var moved = shots.splice(dragFrom, 1)[0];
        shots.splice(i, 0, moved);
        dragFrom = null;
        paintShots();
      });

      wrap.appendChild(d);
    });
  }
  var dragFrom = null;

  function addFiles(files) {
    Array.prototype.forEach.call(files, function (f) {
      if (!/^image\//.test(f.type)) return;
      shots.push({ file: f, preview: URL.createObjectURL(f) });
    });
    paintShots();
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

  $('pickVideo').addEventListener('click', function () { $('fVideo').click(); });
  $('fVideo').addEventListener('change', function (e) {
    videoFile = e.target.files[0] || null;
    $('videoName').textContent = videoFile ? videoFile.name : (videoUrl ? 'video attached' : 'none');
  });

  /* ---------- upload + save ---------- */
  function uploadOne(file, slug) {
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var path = slug + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    return sb.storage.from('media').upload(path, file, {
      cacheControl: '31536000',
      upsert: false
    }).then(function (res) {
      if (res.error) throw res.error;
      return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
    });
  }

  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    showErr('formErr', '');

    if (!shots.length) { showErr('formErr', 'Add at least one photo.'); return; }

    var name = $('fName').value.trim();
    var slug = editing ? editing.slug : slugify(name) + '-' + Math.random().toString(36).slice(2, 6);

    var pending = shots.filter(function (s) { return s.file; }).length + (videoFile ? 1 : 0);
    var done = 0;
    var save = $('saveBtn');
    save.disabled = true;

    if (pending) {
      $('prog').hidden = false;
      $('progBar').style.width = '0%';
      $('progTxt').textContent = 'Uploading 0 of ' + pending;
    }

    function tick() {
      done++;
      $('progBar').style.width = Math.round((done / pending) * 100) + '%';
      $('progTxt').textContent = 'Uploading ' + done + ' of ' + pending;
    }

    // upload new photos in order, keep already-hosted ones as they are
    var chain = Promise.resolve();
    var urls = [];
    shots.forEach(function (s) {
      chain = chain.then(function () {
        if (s.url) { urls.push(s.url); return; }
        return uploadOne(s.file, slug).then(function (u) { urls.push(u); tick(); });
      });
    });

    chain
      .then(function () {
        if (!videoFile) return videoUrl;
        return uploadOne(videoFile, slug).then(function (u) { tick(); return u; });
      })
      .then(function (vid) {
        var payload = {
          slug: slug,
          name: name,
          tag: $('fTag').value,
          price_low: parseInt($('fPriceLow').value, 10) || 0,
          price_high: $('fPriceHigh').value ? parseInt($('fPriceHigh').value, 10) : null,
          sizes: $('fSizes').value.trim(),
          note: $('fNote').value.trim(),
          images: urls,
          video_url: vid || null,
          published: $('fPublished').checked
        };
        if (editing) return sb.from('products').update(payload).eq('id', editing.id);
        payload.position = rows.length;
        return sb.from('products').insert(payload);
      })
      .then(function (res) {
        save.disabled = false;
        $('prog').hidden = true;
        if (res && res.error) { showErr('formErr', res.error.message); return; }
        toast(editing ? 'Piece updated' : 'Piece added');
        closeForm();
        load();
      })
      .catch(function (err) {
        save.disabled = false;
        $('prog').hidden = true;
        showErr('formErr', err.message || 'Upload failed. Please try again.');
      });
  });

  /* ---------- delete ---------- */
  $('deleteBtn').addEventListener('click', function () {
    if (!editing) return;
    if (!confirm('Delete "' + editing.name + '"? This cannot be undone.')) return;
    sb.from('products').delete().eq('id', editing.id).then(function (res) {
      if (res.error) { toast(res.error.message, true); return; }
      toast('Piece deleted');
      closeForm();
      load();
    });
  });

  /* ============================================================
     IMPORT the catalogue that shipped with the site
     ============================================================ */
  $('importBtn').addEventListener('click', function () {
    var seed = window.BYJOOY_PRODUCTS || [];
    if (!seed.length) { toast('Nothing to import', true); return; }

    var have = {};
    rows.forEach(function (r) { have[r.slug] = true; });
    var add = seed.filter(function (p) { return !have[p.slug]; });
    if (!add.length) { toast('Already imported'); return; }

    if (!confirm('Import ' + add.length + ' styles from the site catalogue?')) return;

    var base = location.origin +
      location.pathname.replace(/\/admin\/.*$/, '') + '/assets/img/';

    var payload = add.map(function (p, i) {
      return {
        slug: p.slug,
        name: p.name,
        tag: p.tag,
        price_low: p.priceLow,
        price_high: p.priceHigh || null,
        sizes: p.sizes,
        note: p.note,
        images: p.images.map(function (f) { return base + p.slug + '/' + f; }),
        published: true,
        position: rows.length + i
      };
    });

    $('importBtn').disabled = true;
    sb.from('products').insert(payload).then(function (res) {
      $('importBtn').disabled = false;
      if (res.error) { toast(res.error.message, true); return; }
      toast('Imported ' + payload.length + ' styles');
      load();
    });
  });
})();

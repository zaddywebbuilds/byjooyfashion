/* ============================================================
   ByJooy - interactions
   ============================================================ */
(function () {
  'use strict';

  var P = window.BYJOOY_PRODUCTS || [];
  var IMG = 'assets/img/';
  var CFG = window.BYJOOY_CONFIG || {};
  var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- helpers ---------- */
  function src(p, i) { return IMG + p.slug + '/' + p.images[i]; }
  function thumb(p, i) { return IMG + p.slug + '/thumb/' + p.images[i]; }
  function naira(n) { return '₦' + n.toLocaleString('en-NG'); }
  function priceLabel(p) {
    return p.priceHigh ? naira(p.priceLow) + ' – ' + naira(p.priceHigh) : naira(p.priceLow);
  }
  var WA = CFG.WHATSAPP || '2349038800195';

  function waIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28Z"/>' +
      '</svg>';
  }

  // Pre-fills the chat so she receives the style, the colourway and the
  // price already quoted, and only has to be told a size.
  function waLink(p, colourway) {
    var what = colourway
      ? p.name + ', colourway ' + pad(colourway)
      : p.name;
    var msg =
      'Hello ByJooy,\n\n' +
      'I would like to order the ' + what + ' (' + priceLabel(p) + ').\n\n' +
      'My size is: \n' +
      'Delivery location: \n\n' +
      'Please confirm availability and how to pay. Thank you.';
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ============================================================
     LOADER
     ============================================================ */
  function runLoader(done) {
    var loader = document.getElementById('loader');
    var marks = loader.querySelectorAll('.loader__mark span');
    var meta = loader.querySelector('.loader__meta');
    var bar = document.getElementById('loaderBar');
    var count = document.getElementById('loaderCount');

    // tells the inline failsafe in index.html to stand down
    loader.dataset.handled = '1';

    if (reduced) {
      loader.style.display = 'none';
      done();
      return;
    }

    var fired = false;
    function finish() {
      if (fired) return;
      fired = true;
      done();
    }

    // Safety net: if rAF is throttled (backgrounded tab) the timeline can stall,
    // so never let the loader sit on top of the site for more than 6s.
    var bail = setTimeout(function () {
      tl.progress(1);
      gsap.set(loader, { display: 'none' });
      finish();
    }, 6000);

    var tl = gsap.timeline({
      onComplete: function () { clearTimeout(bail); finish(); }
    });
    tl.to(marks, { y: '0%', opacity: 1, duration: .7, stagger: .04, ease: 'power3.out' })
      .to(meta, { opacity: 1, duration: .4 }, '-=.4')
      .to(bar, { width: '100%', duration: .8, ease: 'power2.inOut' }, '-=.25')
      .to({ v: 0 }, {
        v: 100, duration: .8, ease: 'power2.inOut',
        onUpdate: function () { count.textContent = Math.round(this.targets()[0].v); }
      }, '<')
      .to(loader, { yPercent: -100, duration: .9, ease: 'expo.inOut' }, '+=.1')
      .set(loader, { display: 'none' });
  }

  /* ============================================================
     SMOOTH SCROLL
     ============================================================ */
  var lenis = null;
  function initScroll() {
    if (reduced || typeof Lenis === 'undefined') return;
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: 0, duration: 1.3 });
      });
    });
  }

  /* ============================================================
     HERO
     ============================================================ */
  // Some mobile browsers ignore the autoplay attribute but will honour a
  // programmatic play() on a muted inline video, so ask once. If it is
  // still refused the poster frame stands in.
  function initHeroVideo() {
    var v = document.getElementById('heroVideo');
    if (!v) return;
    if (reduced) { v.removeAttribute('autoplay'); v.pause(); return; }
    var go = v.play();
    if (go && go.catch) go.catch(function () {});
  }

  /* ============================================================
     MARQUEE
     ============================================================ */
  function buildMarquee() {
    var track = document.getElementById('marqueeTrack');
    if (!track) return;
    var words = ['African prints', 'Adire', 'Ankara', 'Silk', 'Crepe',
                 'Ready to wear', 'Lagos', 'Size 6–22'];
    var set = words.concat(words, words);
    set.forEach(function (w) { track.appendChild(el('span', null, w)); });

    if (reduced) return;
    var half = track.scrollWidth / 3;
    gsap.to(track, { x: -half, duration: 26, ease: 'none', repeat: -1 });
  }

  /* ============================================================
     STATEMENT - word reveal
     ============================================================ */
  function statementReveal() {
    var node = document.getElementById('statementCopy');
    if (!node) return;
    var words = node.textContent.trim().split(/\s+/);
    node.innerHTML = words.map(function (w) {
      return '<span class="w"><i>' + w + '</i></span>';
    }).join(' ');

    if (reduced) { gsap.set(node.querySelectorAll('.w i'), { y: 0 }); return; }

    gsap.to(node.querySelectorAll('.w i'), {
      y: '0%', duration: .95, stagger: .022, ease: 'power3.out',
      scrollTrigger: { trigger: node, start: 'top 78%' }
    });
  }

  /* ============================================================
     FEATURED - horizontal pin
     ============================================================ */
  var FEATURED = [
    'adire-asoke-2-piece-set', 'adire-boubou', 'adire-3-tiered-gown',
    'adire-snatched-boubou', 'adire-backless-gown', 'adire-2-piece-set',
    'adire-smocked-long-dress', 'adire-jumpsuit'
  ];

  function buildFeatured() {
    var track = document.getElementById('featuredTrack');
    if (!track) return;

    FEATURED.forEach(function (slug, i) {
      var p = P.find(function (x) { return x.slug === slug; });
      if (!p) return;
      var card = el('article', 'fcard');
      card.dataset.slug = p.slug;
      card.innerHTML =
        '<div class="fcard__media">' +
          '<img src="' + thumb(p, 0) + '" alt="' + p.name +
            '" width="440" height="587" loading="lazy" decoding="async">' +
        '</div>' +
        '<div class="fcard__foot">' +
          '<span class="fcard__num">' + pad(i + 1) + '</span>' +
          '<span class="fcard__name">' + p.name + '</span>' +
          '<span class="fcard__price">' + priceLabel(p) + '</span>' +
        '</div>' +
        '<div class="fcard__act">' +
          '<a class="fcard__wa" href="' + waLink(p) + '" target="_blank" rel="noopener">' +
            waIcon() + 'Order on WhatsApp' +
          '</a>' +
        '</div>';
      card.addEventListener('click', function (e) {
        if (e.target.closest('.fcard__wa')) return;
        openLB(p);
      });
      track.appendChild(card);
    });

    if (reduced || window.innerWidth < 861) return;

    var pin = document.querySelector('.featured__pin');
    gsap.to(track, {
      x: function () { return -(track.scrollWidth - window.innerWidth + 40); },
      ease: 'none',
      scrollTrigger: {
        trigger: '.featured',
        start: 'top top',
        end: function () { return '+=' + (track.scrollWidth - window.innerWidth + 400); },
        pin: pin,
        scrub: .7,
        invalidateOnRefresh: true
      }
    });
  }

  /* ============================================================
     COLLECTION GRID
     ============================================================ */
  function buildGrid() {
    var grid = document.getElementById('grid');
    var filters = document.getElementById('filters');
    if (!grid) return;

    // filters
    var tags = ['All'].concat(P.map(function (p) { return p.tag; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }));
    tags.forEach(function (t, i) {
      var b = el('button', 'chip' + (i === 0 ? ' is-on' : ''), t);
      b.dataset.tag = t;
      b.addEventListener('click', function () {
        filters.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-on'); });
        b.classList.add('is-on');
        grid.querySelectorAll('.pcard').forEach(function (c) {
          c.classList.toggle('is-out', t !== 'All' && c.dataset.tag !== t);
        });
        ScrollTrigger.refresh();
      });
      filters.appendChild(b);
    });

    // cards
    P.forEach(function (p) {
      var card = el('article', 'pcard rv');
      card.dataset.tag = p.tag;

      var shots = p.images.slice(0, 5);
      var imgHtml = shots.map(function (f, i) {
        // only the cover loads up front; the rest hold a blank pixel until hover
        if (i === 0) {
          return '<img src="' + thumb(p, 0) + '" alt="' + p.name +
                 '" width="440" height="587" loading="lazy" decoding="async" class="is-on">';
        }
        return '<img src="' + BLANK + '" data-src="' + thumb(p, i) +
               '" alt="" width="440" height="587" decoding="async" aria-hidden="true">';
      }).join('');
      var dotHtml = shots.map(function (_, i) {
        return '<i' + (i === 0 ? ' class="is-on"' : '') + '></i>';
      }).join('');

      card.innerHTML =
        '<div class="pcard__media">' + imgHtml + '</div>' +
        '<span class="pcard__dots">' + dotHtml + '</span>' +
        '<div class="pcard__foot">' +
          '<span class="pcard__id">' +
            '<span class="pcard__name">' + p.name + '</span>' +
            '<span class="pcard__sizes">Sizes ' + p.sizes + ' &middot; ' +
              p.images.length + ' colourways</span>' +
          '</span>' +
          '<span class="pcard__price">' + priceLabel(p) + '</span>' +
        '</div>' +
        '<div class="pcard__act">' +
          '<a class="pcard__wa" href="' + waLink(p) + '" target="_blank" rel="noopener">' +
            waIcon() + 'Order' +
          '</a>' +
          '<button class="pcard__view" type="button">View all ' + p.images.length + ' images</button>' +
        '</div>';

      var media = card.querySelector('.pcard__media');
      var imgs = card.querySelectorAll('.pcard__media img');
      var dots = card.querySelectorAll('.pcard__dots i');
      var timer = null, idx = 0;

      function show(n) {
        imgs[idx].classList.remove('is-on');
        dots[idx].classList.remove('is-on');
        idx = n;
        imgs[idx].classList.add('is-on');
        dots[idx].classList.add('is-on');
      }

      function wakeImages() {
        for (var k = 0; k < imgs.length; k++) {
          var ds = imgs[k].getAttribute('data-src');
          if (ds) {
            imgs[k].src = ds;
            imgs[k].removeAttribute('data-src');
            imgs[k].removeAttribute('aria-hidden');
          }
        }
      }

      if (!isTouch) {
        card.addEventListener('mouseenter', function () {
          if (imgs.length < 2) return;
          wakeImages();
          timer = setInterval(function () { show((idx + 1) % imgs.length); }, 850);
        });
        card.addEventListener('mouseleave', function () {
          clearInterval(timer);
          show(0);
          gsap.to(media, { rotateX: 0, rotateY: 0, duration: .7, ease: 'power3.out' });
        });
        card.addEventListener('mousemove', function (e) {
          var r = media.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - .5;
          var py = (e.clientY - r.top) / r.height - .5;
          gsap.to(media, {
            rotateY: px * 11, rotateX: -py * 11,
            duration: .5, ease: 'power2.out', transformPerspective: 1000
          });
        });
      }

      // the WhatsApp link must not also open the lightbox
      card.addEventListener('click', function (e) {
        if (e.target.closest('.pcard__wa')) return;
        openLB(p);
      });
      grid.appendChild(card);
    });

    // reveal
    if (!reduced) {
      gsap.utils.toArray('.pcard').forEach(function (c, i) {
        gsap.to(c, {
          opacity: 1, y: 0, duration: .9, ease: 'power3.out', delay: (i % 4) * .06,
          scrollTrigger: { trigger: c, start: 'top 88%' }
        });
      });
    } else {
      gsap.set('.pcard', { opacity: 1, y: 0 });
    }
  }

  /* ============================================================
     FILLER ART - keeps the long sections from running empty
     ============================================================ */
  function fillArt(nodeId, picks) {
    var wrap = document.getElementById(nodeId);
    if (!wrap) return;
    picks.forEach(function (pick) {
      var p = P.find(function (x) { return x.slug === pick[0]; });
      if (!p) return;
      var i = Math.min(pick[1], p.images.length - 1);
      var fig = el('figure');
      fig.innerHTML = '<img src="' + src(p, i) + '" alt="' + p.name +
                      '" loading="lazy" decoding="async">';
      wrap.appendChild(fig);
    });
  }

  /* ============================================================
     CRAFT - parallax stack
     ============================================================ */
  var CRAFT_PICKS = [
    ['adire-asoke-2-piece-set', 4],
    ['adire-2-piece-set', 3],
    ['adire-short-2-tone-dress', 6],
    ['adire-combo-2-piece-set', 2]
  ];

  function buildCraft() {
    var wrap = document.getElementById('craftMedia');
    if (!wrap) return;

    CRAFT_PICKS.forEach(function (pick) {
      var p = P.find(function (x) { return x.slug === pick[0]; });
      if (!p) return;
      var i = Math.min(pick[1], p.images.length - 1);
      var fig = el('figure');
      fig.innerHTML = '<img src="' + src(p, i) + '" alt="' + p.name + '" loading="lazy">';
      wrap.appendChild(fig);
    });

    if (reduced) return;
    gsap.utils.toArray('#craftMedia img').forEach(function (im) {
      gsap.fromTo(im, { yPercent: -8, scale: 1.14 }, {
        yPercent: 8, scale: 1.14, ease: 'none',
        scrollTrigger: { trigger: im.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ============================================================
     LIGHTBOX
     ============================================================ */
  var lb = document.getElementById('lb');
  var lbGrid = document.getElementById('lbGrid');

  function openLB(p) {
    document.getElementById('lbTag').textContent = p.tag;
    document.getElementById('lbName').textContent = p.name;
    document.getElementById('lbNote').textContent = p.note;
    document.getElementById('lbPrice').textContent = priceLabel(p);
    document.getElementById('lbSizes').textContent = p.sizes;
    document.getElementById('lbCount').textContent = p.images.length;

    document.getElementById('lbOrder').href = waLink(p);

    lbGrid.innerHTML = '';
    p.images.forEach(function (f, i) {
      var fig = el('figure');
      fig.innerHTML =
        '<span class="lb__shot"><img src="' + IMG + p.slug + '/' + f +
          '" alt="' + p.name + ' colourway ' + (i + 1) + '" loading="lazy"></span>' +
        '<figcaption>' +
          '<span>Colourway ' + pad(i + 1) + '</span>' +
          '<a class="lb__wa" href="' + waLink(p, i + 1) + '" target="_blank" rel="noopener">' +
            waIcon() + 'Order this colour' +
          '</a>' +
        '</figcaption>';
      lbGrid.appendChild(fig);
    });

    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    if (lenis) lenis.stop();
    lb.scrollTop = 0;

    if (!reduced) {
      gsap.fromTo(lbGrid.children,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: .7, stagger: .03, ease: 'power3.out', delay: .15 });
    }
  }

  function closeLB() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
  }

  document.getElementById('lbClose').addEventListener('click', closeLB);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lb.classList.contains('is-open')) closeLB();
  });

  /* ============================================================
     CURSOR + MAGNET + NAV
     ============================================================ */
  function initCursor() {
    if (isTouch || reduced) return;
    var c = document.getElementById('cursor');
    var x = gsap.quickTo(c, 'x', { duration: .45, ease: 'power3' });
    var y = gsap.quickTo(c, 'y', { duration: .45, ease: 'power3' });

    window.addEventListener('mousemove', function (e) {
      gsap.to(c, { opacity: 1, duration: .3 });
      x(e.clientX); y(e.clientY);
    });

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a,button,.pcard,.fcard,figure')) c.classList.add('is-big');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('a,button,.pcard,.fcard,figure')) c.classList.remove('is-big');
    });
  }

  function initMagnet() {
    if (isTouch || reduced) return;
    document.querySelectorAll('[data-magnet]').forEach(function (m) {
      m.addEventListener('mousemove', function (e) {
        var r = m.getBoundingClientRect();
        gsap.to(m, {
          x: (e.clientX - r.left - r.width / 2) * .3,
          y: (e.clientY - r.top - r.height / 2) * .4,
          duration: .6, ease: 'power3.out'
        });
      });
      m.addEventListener('mouseleave', function () {
        gsap.to(m, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' });
      });
    });
  }

  function initNav() {
    var nav = document.getElementById('nav');
    var last = 0;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        if (y > 400 && y > last) nav.classList.add('is-hidden');
        else nav.classList.remove('is-hidden');
        last = y;
      }
    });
  }

  function buildFootStrip() {
    var wrap = document.getElementById('footStrip');
    if (!wrap) return;
    // one cover from each of the first eight styles
    P.slice(0, 8).forEach(function (p) {
      if (!p.images || !p.images.length) return;
      var fig = el('figure');
      fig.innerHTML = '<img src="' + thumb(p, 0) + '" alt="" loading="lazy" decoding="async">';
      wrap.appendChild(fig);
    });
  }

  function initFooter() {
    document.getElementById('yr').textContent = new Date().getFullYear();
    if (reduced) return;
    gsap.fromTo('#footMark', { scale: .9, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.foot', start: 'top 85%' }
    });
  }

  function revealAll() {
    if (reduced) { gsap.set('.rv', { opacity: 1, y: 0 }); return; }
    gsap.utils.toArray('.statement__meta div, .craft__steps li, .order__grid div').forEach(function (n, i) {
      gsap.from(n, {
        opacity: 0, y: 28, duration: .85, ease: 'power3.out', delay: (i % 4) * .07,
        scrollTrigger: { trigger: n, start: 'top 90%' }
      });
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    initHeroVideo();
    buildMarquee();
    buildFeatured();
    buildGrid();
    buildCraft();
    fillArt('statementArt', [
      ['adire-boubou', 1],
      ['adire-jumpsuit', 2],
      ['adire-long-skirt-set', 1],
      ['adire-backless-gown', 2]
    ]);
    fillArt('orderArt', [
      ['adire-asoke-2-piece-set', 12],
      ['adire-2-piece-set', 8]
    ]);
    statementReveal();
    initCursor();
    initMagnet();
    initNav();
    buildFootStrip();
    initFooter();
    revealAll();
    ScrollTrigger.refresh();
  }

  /* ============================================================
     CATALOGUE SOURCE

     data/products.json is what the Studio dashboard writes, so it is
     the live catalogue. products.js is the copy baked into the page
     and is used if that file cannot be fetched, so the collection can
     never come up empty.
     ============================================================ */
  function loadCatalogue() {
    var bundled = window.BYJOOY_PRODUCTS || [];
    var path = (CFG.DATA_PATH || 'data/products.json') + '?t=' + Date.now();

    return fetch(path, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('no catalogue');
        return r.json();
      })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) return bundled;
        return list.filter(function (p) {
          return !p.hidden && p.images && p.images.length;
        });
      })
      .catch(function () { return bundled; });
  }

  function start() {
    initScroll();
    loadCatalogue().then(function (list) {
      P = list;
      runLoader(boot);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { ScrollTrigger.refresh(); }, 220);
  });
})();

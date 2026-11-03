/* ============================================================
   ByJooy - interactions
   ============================================================ */
(function () {
  'use strict';

  var P = window.BYJOOY_PRODUCTS || [];
  var IMG = 'assets/img/';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- helpers ---------- */
  function src(p, i) { return IMG + p.slug + '/' + p.images[i]; }
  function naira(n) { return '₦' + n.toLocaleString('en-NG'); }
  function priceLabel(p) {
    return p.priceHigh ? naira(p.priceLow) + ' – ' + naira(p.priceHigh) : naira(p.priceLow);
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
     HERO - scroll-zoom card
     ============================================================ */
  var HERO_PICKS = [
    ['adire-asoke-2-piece-set', 0],
    ['adire-short-2-tone-dress', 0],
    ['adire-2-piece-set', 0],
    ['adire-boubou', 0],
    ['adire-3-tiered-gown', 0]
  ];

  function buildHero() {
    var media = document.getElementById('heroMedia');
    var imgs = [];

    HERO_PICKS.forEach(function (pick, i) {
      var p = P.find(function (x) { return x.slug === pick[0]; });
      if (!p) return;
      var im = new Image();
      im.src = src(p, pick[1]);
      im.alt = p.name;
      if (i > 0) im.loading = 'lazy';
      media.appendChild(im);
      imgs.push(im);
    });

    if (!imgs.length) return;
    imgs[0].classList.add('is-on');

    if (!reduced && imgs.length > 1) {
      var cur = 0;
      setInterval(function () {
        imgs[cur].classList.remove('is-on');
        cur = (cur + 1) % imgs.length;
        imgs[cur].classList.add('is-on');
      }, 4200);
    }

  }

  function heroZoom() {
    var hero = document.getElementById('hero');
    var card = document.getElementById('heroCard');
    if (!hero || !card) return;

    var bezel = card.querySelector('.hero__bezel');
    var screen = card.querySelector('.hero__screen');
    var intro = document.getElementById('heroIntro');
    var hint = document.getElementById('heroHint');

    // The card sits below the headline, so as it scales up it also has to
    // travel to the middle of the viewport or it grows off the bottom.
    var fit = { s: 1, dy: 0 };
    function measure() {
      var w = card.offsetWidth, h = card.offsetHeight;
      if (!w || !h) return;
      fit.s = Math.max(window.innerWidth / w, window.innerHeight / h);
      fit.dy = (window.innerHeight / 2) - (card.offsetTop + h / 2);
    }
    measure();

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: .8,
        invalidateOnRefresh: true
      }
    });

    tl.fromTo(card,
        { scale: 1, y: 0 },
        {
          scale: function () { return fit.s; },
          y: function () { return fit.dy; },
          ease: 'none'
        }, 0)
      .fromTo(bezel, { padding: 10, borderRadius: 26 }, { padding: 0, borderRadius: 0, ease: 'none' }, 0)
      .fromTo(screen, { borderRadius: 18 }, { borderRadius: 0, ease: 'none' }, 0)
      .to(intro, { opacity: 0, y: -50, ease: 'none', duration: .45 }, 0)
      .to('.hero__bg', { opacity: 0, ease: 'none' }, 0)
      .to(hint, { opacity: 0, ease: 'none', duration: .2 }, 0);

    ScrollTrigger.addEventListener('refreshInit', measure);
  }

  /* ============================================================
     MARQUEE
     ============================================================ */
  function buildMarquee() {
    var track = document.getElementById('marqueeTrack');
    if (!track) return;
    var words = ['Hand-dyed', 'Adire', 'Made to order', 'Lagos', 'Size 6–22', 'No two alike'];
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
          '<img src="' + src(p, 0) + '" alt="' + p.name + '" loading="lazy">' +
        '</div>' +
        '<div class="fcard__foot">' +
          '<span class="fcard__num">' + pad(i + 1) + '</span>' +
          '<span class="fcard__name">' + p.name + '</span>' +
          '<span class="fcard__price">' + priceLabel(p) + '</span>' +
        '</div>';
      card.addEventListener('click', function () { openLB(p); });
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
        return '<img src="' + IMG + p.slug + '/' + f + '" alt="' + p.name +
               '" loading="lazy"' + (i === 0 ? ' class="is-on"' : '') + '>';
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
            '<span class="pcard__sizes">Sizes ' + p.sizes + '</span>' +
          '</span>' +
          '<span class="pcard__price">' + priceLabel(p) + '</span>' +
        '</div>' +
        '<div class="pcard__meta">' +
          '<span class="pcard__tag">' + p.tag + '</span>' +
          '<span class="pcard__badge">' + p.images.length + ' colourways</span>' +
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

      if (!isTouch) {
        card.addEventListener('mouseenter', function () {
          if (imgs.length < 2) return;
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

      card.addEventListener('click', function () { openLB(p); });
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

    var order = document.getElementById('lbOrder');
    order.href = 'https://wa.me/2349038800195?text=' +
      encodeURIComponent('Hi ByJooy, I would like to order the ' + p.name + '.');

    lbGrid.innerHTML = '';
    p.images.forEach(function (f, i) {
      var fig = el('figure');
      fig.innerHTML = '<span class="lb__shot"><img src="' + IMG + p.slug + '/' + f +
                      '" alt="' + p.name + ' colourway ' + (i + 1) + '" loading="lazy"></span>' +
                      '<figcaption>Colourway ' + pad(i + 1) + '</figcaption>';
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
    buildHero();
    buildMarquee();
    buildFeatured();
    buildGrid();
    buildCraft();
    statementReveal();
    initCursor();
    initMagnet();
    initNav();
    initFooter();
    revealAll();
    heroZoom();
    ScrollTrigger.refresh();
  }

  function start() {
    initScroll();
    runLoader(boot);
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

(() => {
  'use strict';

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem('rt.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('rt.' + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const onVisible = (el, cb, margin = '100px') => {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting)), { rootMargin: margin }).observe(el);
  };

  /* ---------- toast ---------- */
  const toastEl = $('#toast');
  let toastT = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  /* ---------- copy email ---------- */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
    const state = btn.querySelector('.copy-state');
    const finish = ok => {
      if (!ok) {
        const span = btn.querySelector('.copy-text');
        const range = document.createRange();
        range.selectNodeContents(span);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      state.textContent = ok ? 'Copied' : 'Selected';
      setTimeout(() => { state.textContent = 'Copy'; }, 1800);
    };
    try { navigator.clipboard.writeText(btn.dataset.copy).then(() => finish(true), () => finish(false)); }
    catch (e) { finish(false); }
  }));

  /* ---------- modal manager ---------- */
  const stack = [];
  function modal(el, opts = {}) {
    let prev = null;
    const api = {
      el,
      isOpen: () => stack.includes(api),
      open(focusSel) {
        if (!api.isOpen()) {
          prev = document.activeElement;
          stack.push(api);
        }
        el.hidden = false;
        document.documentElement.classList.add('modal-open');
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
        const f = focusSel ? el.querySelector(focusSel) : el.querySelector('[data-close], button');
        setTimeout(() => f && f.focus({ preventScroll: true }), 40);
      },
      close() {
        const i = stack.indexOf(api);
        if (i < 0) return;
        stack.splice(i, 1);
        el.classList.remove('open');
        if (opts.onClose) opts.onClose();
        setTimeout(() => { if (!el.classList.contains('open')) el.hidden = true; }, reduce ? 0 : 300);
        if (!stack.length) document.documentElement.classList.remove('modal-open');
        if (prev && prev.focus) prev.focus({ preventScroll: true });
      }
    };
    el.addEventListener('click', e => {
      if (e.target === el || e.target.closest('[data-close]')) api.close();
    });
    return api;
  }
  document.addEventListener('keydown', e => {
    const top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') { e.preventDefault(); top.close(); return; }
    if (e.key === 'Tab') {
      const f = $$('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])', top.el).filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* =========================================================
     HOME: app switcher changes the name's typeface
     ========================================================= */
  const heroName = $('#heroName');
  $$('.sw-card').forEach(card => {
    const on = () => { heroName.className = 'name f-' + card.dataset.font; };
    const off = () => { heroName.className = 'name'; };
    card.addEventListener('mouseenter', on);
    card.addEventListener('focus', on);
    card.addEventListener('mouseleave', off);
    card.addEventListener('blur', off);
  });

  /* =========================================================
     DOCK: highlight the section in view
     ========================================================= */
  const dockLinks = $$('.dock a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) dockLinks.forEach(a => a.classList.toggle('active', a.dataset.sec === en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach(s => io.observe(s));
  }

  /* =========================================================
     LIBRARY (Google · Play Books)
     ========================================================= */
  const CATS = { growth: 'Product & Growth', swiftui: 'SwiftUI & UIKit', reliability: 'Reliability', ai: 'AI & Agents' };
  const BOOKS = [
    {
      id: 'sdui', spine: 'The Server-Driven Page', title: 'The Server-Driven Page', sub: 'Book Details, rebuilt in server-driven SwiftUI',
      cats: ['swiftui', 'growth'], c: '#7A1E2C', t: '#F1DFC0', w: 62, h: 286, font: 'book',
      stat: '−18%', statLabel: 'load time on the Book Details page',
      body: [
        'I migrated the Book Details page from UIKit to server-driven SwiftUI. In a server-driven UI, the server describes the layout and the app renders it with native views.',
        'The migration let me delete more than <mark>3,200 lines</mark> of old code. Load time fell about <mark>18%</mark>, and high-intent CTA conversions rose <mark>2.3%</mark>.'
      ],
      tags: ['SwiftUI', 'Server-driven UI', 'UIKit migration']
    },
    {
      id: 'japan', spine: 'The Japan Edition', title: 'The Japan Edition', sub: 'Audiobooks and episodic content in Japan',
      cats: ['growth'], c: '#E9DFC8', t: '#8C2A1C', w: 54, h: 256, font: 'ui', sun: true,
      stat: '+44.34%', statLabel: 'audiobook and episode consumption in Japan',
      body: [
        'Episodic content needs quick ways to move between episodes and whole series. I added context menus and easier series navigation for episodic titles.',
        'In Japan, audiobook and episode consumption grew <mark>44.34%</mark> and clicks grew <mark>17.61%</mark>.'
      ],
      tags: ['Growth', 'Context menus', 'Series navigation']
    },
    {
      id: 'hide', spine: 'Hide & Seek', title: 'Hide & Seek', sub: 'Series and library management',
      cats: ['swiftui', 'growth', 'reliability'], c: '#1F5E5B', t: '#EAD9B5', w: 70, h: 298, font: 'fat',
      stat: '99.98%', statLabel: 'crash-free sessions, held through the change',
      body: [
        'I built hide and unhide for single books and whole series, plus a Hidden Books tab to find them again.',
        'Updates are optimistic: the library changes instantly, then rolls back if the server call fails. Series tab interactions rose <mark>8.7%</mark> and daily active readers rose <mark>1.42%</mark>, while crash-free sessions held at <mark>99.98%</mark>.'
      ],
      note: 'The topic filter on this shelf works the same way. Books you filter out go to Hidden.',
      tags: ['SwiftUI', 'Optimistic updates', 'Library']
    },
    {
      id: 'logs', spine: '12.6M Quiet Errors', title: '12.6 Million Quiet Errors', sub: 'Logging and error monitoring',
      cats: ['reliability'], c: '#1D2B53', t: '#F2C14E', w: 58, h: 270, font: 'poster',
      stat: '12.6M+', statLabel: 'non-fatal errors brought to light',
      body: [
        'I moved the app’s logging to a privacy-safe structured logger and improved crash monitoring.',
        'The new logs caught more than <mark>12.6 million</mark> non-fatal errors in web views and sync that had gone unnoticed.'
      ],
      tags: ['Structured logging', 'Privacy', 'Crash monitoring']
    },
    {
      id: 'preview', spine: 'Try Before You Buy', title: 'Try Before You Buy', sub: 'Book Preview Card and sample reader',
      cats: ['swiftui', 'growth'], c: '#D9A21B', t: '#2A1A06', w: 66, h: 280, font: 'book',
      stat: 'RTL', statLabel: 'right-to-left paging, so manga reads the way it should',
      body: [
        'I built the Book Preview Card and the sample reader in SwiftUI and UIKit, so readers can flip through manga and comics before they buy.',
        'It has auto-scrolling carousels, right-to-left paging and VoiceOver accessibility.'
      ],
      tags: ['SwiftUI', 'UIKit', 'VoiceOver', 'Manga & comics']
    },
    {
      id: 'rules', spine: 'Rules for Robots', title: 'Rules for Robots', sub: 'Play Books iOS coding rules for AI agents',
      cats: ['ai'], c: '#2F4A33', t: '#E9DFC8', w: 50, h: 262, font: 'ui',
      stat: '100', statLabel: 'column limit, now written down for AI agents too',
      body: [
        'I wrote the Play Books iOS coding rules that AI agents follow, covering things like Swift concurrency and the 100-column limit.',
        'The rules are used alongside the team’s Swift style and review-comment skills.'
      ],
      tags: ['AI agents', 'Swift concurrency', 'Code style']
    },
    {
      id: 'graph', spine: 'The Critic Wants a Nine', title: 'The Critic Wants a Nine', sub: 'A multi-agent graph that writes design docs',
      cats: ['ai'], c: '#5A2A55', t: '#F0D7E8', w: 60, h: 300, font: 'fat',
      stat: '9/10', statLabel: 'the score a section needs before the critic lets it through',
      body: [
        'I built a multi-agent graph that writes design docs and pauses for human review on key decisions.',
        'For each section, one agent researches the code and docs, one drafts, and a fresh-context critic sends it back until it scores <mark>9/10</mark>.'
      ],
      tags: ['Multi-agent', 'Human-in-the-loop', 'Design docs']
    },
    {
      id: 'loop', spine: 'Review, Fix, Repeat', title: 'Review, Fix, Repeat', sub: 'A Python daemon that answers code review',
      cats: ['ai'], c: '#B4532A', t: '#FBE8D3', w: 56, h: 268, font: 'poster', loop: true,
      flow: ['A reviewer comments, or CI fails', 'The daemon wakes an AI agent', 'The agent fixes the code', 'A custom tech-lead agent reviews it', 'Build, test, re-upload'],
      body: [
        'I wrote a Python daemon that wakes an AI agent when a reviewer comments or CI fails on my changes.',
        'The agent fixes the code, a custom tech-lead agent reviews it, then it builds, tests and re-uploads. Ambiguous fixes come back to me.'
      ],
      tags: ['Python', 'AI agents', 'CI', 'Code review']
    },
    {
      id: 'bot', spine: 'In This Build?', title: 'Is My Change in This Build?', sub: 'An always-on team agent in Google Chat',
      cats: ['ai'], c: '#3E6E9E', t: '#F3F5FA', w: 72, h: 276, font: 'book',
      chat: [['me', 'Is my change in this build?'], ['bot', 'Checking the latest release cut for your change…'], ['meta', 'Also posts: biweekly release-cut digests · live A/B rollouts']],
      body: [
        'I launched an always-on Play Books iOS agent in Google Chat, built on the team’s existing agent skills.',
        'It posts a digest of each biweekly release cut and of live A/B rollouts, and it answers the question everyone asks: is my change in this build?'
      ],
      tags: ['LLM team bot', 'Google Chat', 'Release tooling']
    }
  ];

  const booksEl = $('#books');
  BOOKS.forEach((b, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.style.cssText = `--w:${b.w}px;--h:${b.h}px;--c:${b.c};--t:${b.t};--dir:${i % 2 ? 1 : -1};--spin:${40 + ((i * 37) % 60)}deg`;
    slot.innerHTML = `<button class="book sf-${b.font}" type="button" aria-label="Read ${b.title}">` +
      `<span class="spine-mark" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>` +
      (b.sun ? '<span class="sun" aria-hidden="true"></span>' : '') +
      `<span class="spine-title" aria-hidden="true">${b.spine}</span>` +
      '<span class="spine-foot" aria-hidden="true"></span></button>';
    slot.querySelector('button').addEventListener('click', () => openReader(i));
    booksEl.appendChild(slot);
  });

  /* scale the shelf so it always fits its column */
  const scene = $('.shelf-scene');
  function fitShelf() {
    const narrow = window.matchMedia('(max-width: 760px)').matches;
    const k = Math.min(1, scene.clientWidth / (narrow ? 680 : 780));
    scene.style.setProperty('--k', k.toFixed(3));
    scene.style.setProperty('--k2', Math.max(0.66, Math.min(1, k * 1.4)).toFixed(3));
  }
  fitShelf();
  window.addEventListener('resize', fitShelf);

  const pillsEl = $('#libPills');
  const pillDefs = [['all', 'All', BOOKS.length]].concat(Object.entries(CATS).map(([k, v]) => [k, v, BOOKS.filter(b => b.cats.includes(k)).length]));
  pillsEl.innerHTML = pillDefs.map(([k, v, n]) => `<button type="button" class="pill${k === 'all' ? ' on' : ''}" data-cat="${k}" aria-pressed="${k === 'all'}">${v.replace('&', '&amp;')} <span>${n}</span></button>`).join('');

  let libCat = 'all', libQuery = '';
  const hiddenBtn = $('#libHidden');
  const plain = s => s.replace(/<[^>]+>/g, '');
  function bookMatches(b) {
    const inCat = libCat === 'all' || b.cats.includes(libCat);
    const q = libQuery.trim().toLowerCase();
    if (!q) return inCat;
    const hay = [b.title, b.sub, b.body.join(' '), b.tags.join(' '), b.cats.map(c => CATS[c]).join(' ')].map(plain).join(' ').toLowerCase();
    return inCat && hay.includes(q);
  }
  function applyFilter() {
    let shown = 0, hidden = 0;
    $$('.slot', booksEl).forEach((slot, i) => {
      const ok = bookMatches(BOOKS[i]);
      const isOut = slot.classList.contains('out');
      clearTimeout(slot._t);
      if (ok) {
        shown++;
        if (isOut) {
          slot.classList.remove('out', 'gone');
          slot.classList.add('in');
          slot._t = setTimeout(() => slot.classList.remove('in'), 800);
        }
      } else {
        hidden++;
        if (!isOut) {
          slot.classList.remove('in');
          slot.classList.add('out');
          slot._t = setTimeout(() => slot.classList.add('gone'), reduce ? 0 : 620);
        } else {
          slot.classList.add('gone');
        }
      }
      slot.querySelector('button').tabIndex = ok ? 0 : -1;
    });
    $('#libCount').textContent = shown;
    hiddenBtn.hidden = hidden === 0;
    hiddenBtn.querySelector('b').textContent = hidden;
    $('#shelfEmpty').hidden = shown > 0;
  }
  function setCat(cat) {
    libCat = cat;
    $$('.pill', pillsEl).forEach(p => { const on = p.dataset.cat === cat; p.classList.toggle('on', on); p.setAttribute('aria-pressed', on); });
  }
  pillsEl.addEventListener('click', e => {
    const p = e.target.closest('.pill');
    if (!p) return;
    setCat(p.dataset.cat);
    applyFilter();
  });
  $('#libSearch').addEventListener('input', e => { libQuery = e.target.value; applyFilter(); });
  hiddenBtn.addEventListener('click', () => {
    setCat('all');
    libQuery = '';
    $('#libSearch').value = '';
    applyFilter();
    toast('Unhid every book. They are back on the shelf.');
  });

  /* ---------- reader ---------- */
  const readerEl = $('#reader');
  const aaPop = $('#rdAaPop');
  const aaBtn = $('#rdAa');
  const rd = modal(readerEl, { onClose: () => { aaPop.hidden = true; aaBtn.setAttribute('aria-expanded', 'false'); } });
  let rIdx = 0;
  let rTheme = store.get('rtheme', 'paper');
  let rSize = store.get('rsize', 18);

  function applyReaderPrefs() {
    readerEl.dataset.theme = rTheme;
    readerEl.style.setProperty('--rd-size', rSize + 'px');
    $$('[data-rtheme]', readerEl).forEach(b => b.classList.toggle('on', b.dataset.rtheme === rTheme));
  }
  applyReaderPrefs();

  function leftPage(b, i) {
    let fig;
    if (b.flow) fig = `<ol class="rd-flow${b.loop ? ' loop' : ''}">${b.flow.map(s => `<li>${s}</li>`).join('')}</ol>`;
    else if (b.chat) fig = `<div class="rd-chat">${b.chat.map(([who, t]) => who === 'meta' ? `<small>${t}</small>` : `<p class="${who}">${t}</p>`).join('')}</div>`;
    else fig = `<p class="rd-stat">${b.stat}</p><p class="rd-stat-label">${b.statLabel}</p>`;
    return `<p class="rd-kicker">Chapter ${i + 1} of ${BOOKS.length}</p>` +
      `<h3 class="rd-title">${b.title.replace('&', '&amp;')}</h3><p class="rd-sub">${b.sub}</p>` +
      `<div class="rd-orn" aria-hidden="true">❦</div>${fig}` +
      `<p class="rd-imprint">Google · Play Books for iOS</p><p class="rd-folio">${i * 2 + 1}</p>`;
  }
  function rightPage(b, i) {
    return `<div class="rd-body">${b.body.map(p => `<p>${p}</p>`).join('')}</div>` +
      (b.note ? `<p class="rd-note">${b.note}</p>` : '') +
      `<p class="rd-tags">${b.tags.map(t => `<span>${t.replace('&', '&amp;')}</span>`).join('')}</p>` +
      `<p class="rd-folio">${i * 2 + 2}</p>`;
  }
  function paintReader() {
    const b = BOOKS[rIdx];
    $('#rdLeft').innerHTML = leftPage(b, rIdx);
    $('#rdRight').innerHTML = rightPage(b, rIdx);
    $('#rdBarTitle').textContent = b.title;
    const pct = Math.round((rIdx + 1) / BOOKS.length * 100);
    $('#rdProg').style.width = pct + '%';
    $('#rdProgTxt').textContent = `Chapter ${rIdx + 1} of ${BOOKS.length} · ${pct}% through`;
    $('#rdPrev').disabled = rIdx === 0;
    $('#rdNext').disabled = rIdx === BOOKS.length - 1;
    ['#rdLeft', '#rdRight', '#rdSpread'].forEach(s => { $(s).scrollTop = 0; });
  }
  function openReader(i) {
    rIdx = i;
    paintReader();
    rd.open('#rdNext');
  }
  function turn(dir) {
    const n = rIdx + dir;
    if (n < 0 || n >= BOOKS.length) return;
    const sp = $('#rdSpread');
    if (reduce) { rIdx = n; paintReader(); return; }
    sp.classList.remove('turn-next', 'turn-prev');
    void sp.offsetWidth;
    sp.classList.add(dir > 0 ? 'turn-next' : 'turn-prev');
    setTimeout(() => { rIdx = n; paintReader(); }, 240);
    setTimeout(() => sp.classList.remove('turn-next', 'turn-prev'), 520);
  }
  $('#rdNext').addEventListener('click', () => turn(1));
  $('#rdPrev').addEventListener('click', () => turn(-1));
  document.addEventListener('keydown', e => {
    if (!rd.isOpen() || stack[stack.length - 1] !== rd) return;
    if (e.key === 'ArrowRight') turn(1);
    if (e.key === 'ArrowLeft') turn(-1);
  });
  (() => {
    let x0 = null, y0 = null;
    const stage = $('#rdStage');
    stage.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; });
    stage.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dx) > 60 && Math.abs(dy) < 60) turn(dx < 0 ? 1 : -1);
      x0 = null;
    });
  })();
  aaBtn.addEventListener('click', () => {
    aaPop.hidden = !aaPop.hidden;
    aaBtn.setAttribute('aria-expanded', String(!aaPop.hidden));
  });
  aaPop.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.rtheme) rTheme = t.dataset.rtheme;
    if (t.dataset.rsize) rSize = Math.max(15, Math.min(23, rSize + Number(t.dataset.rsize)));
    store.set('rtheme', rTheme);
    store.set('rsize', rSize);
    applyReaderPrefs();
  });

  /* =========================================================
     STREAM (Disney+ Hotstar)
     ========================================================= */
  const ICONS = {
    download: '<svg viewBox="0 0 64 64"><path d="M32 10v30M20 29l12 12 12-12M14 46v8h36v-8"/></svg>',
    offline: '<svg viewBox="0 0 64 64"><path d="M20 46h26a10 10 0 0 0 1-20 15 15 0 0 0-28 4 8 8 0 0 0 1 16z"/><path d="M10 10l44 44"/></svg>',
    flame: '<svg viewBox="0 0 64 64"><path d="M32 57c-10 0-17-7-17-16 0-9 7-13 9-23 4 4 6 8 6 12 2-2 3-5 3-10 8 5 15 13 15 22 0 9-6 15-16 15z"/><path d="M32 57c-4 0-7-3-7-7 0-4 3-6 4-10 4 3 10 6 10 11 0 3-3 6-7 6z"/></svg>',
    pulse: '<svg viewBox="0 0 64 64"><path d="M4 36h13l6-16 8 30 7-22 5 8h17"/><circle cx="52" cy="16" r="5"/></svg>',
    langs: '<svg viewBox="0 0 64 64"><path d="M8 16h24M20 10v6M13 16c2 8 8 14 17 17M27 16c-2 8-8 14-17 17"/><path d="M34 54l10-24 10 24M38 45h12"/></svg>',
    layers: '<svg viewBox="0 0 64 64"><path d="M32 10 8 22l24 12 24-12zM8 32l24 12 24-12M8 42l24 12 24-12"/></svg>'
  };
  const FEATURES = [
    {
      id: 'downloads', title: 'Downloads', icon: 'download', hues: ['#1E5BFF', '#19C3E6', '#0A1A4A'],
      tagline: 'Save shows and movies. Watch them offline.',
      desc: 'I built the client-side downloads feature, so users can save shows and movies and watch them without a connection. Downloads account for about 20% of the app’s watch time.',
      impact: '≈20% of the app’s watch time', tags: ['Offline playback', 'Client-side', 'iOS']
    },
    {
      id: 'offline', title: 'Offline Analytics', icon: 'offline', hues: ['#6D4CFF', '#B06CFF', '#1A0F4A'],
      tagline: 'Seeing what happens without a connection.',
      desc: 'I added analytics tracking that works while the user is offline, so the team could see for the first time how people use the app without a connection.',
      impact: 'First view of offline usage', tags: ['Analytics', 'Offline-first', 'Event queue']
    },
    {
      id: 'hotnew', title: 'Hot & New', icon: 'flame', hues: ['#FF5A36', '#FF2D87', '#4A0B24'],
      tagline: 'An endless feed of what’s coming.',
      desc: 'I built an endless scrolling feed of trailers for upcoming shows and movies, to help users discover new content.',
      impact: 'Discovery for upcoming titles', tags: ['Infinite feed', 'Video', 'Discovery']
    },
    {
      id: 'polls', title: 'Live Polling', icon: 'pulse', hues: ['#FFB020', '#FF5A36', '#4A2205'],
      tagline: 'Live concurrency at around 59 million viewers.',
      desc: 'I built the polling service that shows live concurrency, the “watching now” count, during live matches and events. It ran at traffic peaks of around 59 million concurrent viewers.',
      impact: '≈59M concurrent viewers at peak', tags: ['Polling service', 'Live concurrency', 'High traffic']
    },
    {
      id: 'onboarding', title: 'Your Languages', icon: 'langs', hues: ['#16C47F', '#14A3B8', '#06352B'],
      tagline: 'Personal from the first launch.',
      desc: 'I built the first-launch flow where new users pick their languages and the kinds of content they like, so their home screen is personalized from the start.',
      impact: 'Personalized home from day one', tags: ['Onboarding', 'Personalization', 'First launch']
    },
    {
      id: 'arch', title: 'Under the Hood', icon: 'layers', hues: ['#7C8DB5', '#3D4F7A', '#0E1428'],
      tagline: 'VIPER and server-driven UI.',
      desc: 'I implemented VIPER architecture and server-driven UI, giving the app a scalable, maintainable and robust foundation that improved its performance and user experience.',
      impact: 'Scalable, maintainable app infrastructure', tags: ['VIPER', 'Server-driven UI', 'Architecture']
    }
  ];
  const artVars = f => `--h1:${f.hues[0]};--h2:${f.hues[1]};--h3:${f.hues[2]}`;
  const esc = s => s.replace(/&/g, '&amp;');
  const PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg>';
  const DL_SVG = '<svg viewBox="0 0 34 34" aria-hidden="true"><circle class="ring-bg" cx="17" cy="17" r="14"/><circle class="ring" cx="17" cy="17" r="14"/><path class="arrow" d="M17 11v10M13 17l4 4 4-4"/></svg>';

  const streamEl = $('#hotstar');
  const downloaded = new Set(store.get('dl', ['downloads', 'offline']));
  let offline = false;
  let queued = 0;

  function track() {
    if (!offline) return;
    queued++;
    $('#queued').textContent = queued;
  }

  /* top row */
  $('#topTrack').innerHTML = FEATURES.map((f, i) =>
    `<div class="top-item"><span class="top-num" aria-hidden="true">${i + 1}</span><div class="poster-wrap">` +
    `<button class="poster" type="button" data-f="${i}" style="${artVars(f)}" aria-label="${esc(f.title)}, more info">` +
    `<span class="pr" aria-hidden="true">R</span><span class="pico" aria-hidden="true">${ICONS[f.icon]}</span>` +
    `<span class="pt">${esc(f.title)}</span>` +
    `<span class="pdl"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>Downloaded</span></button>` +
    `<button class="dl-btn" type="button" data-dl="${i}">${DL_SVG}</button></div></div>`
  ).join('');

  function setDlBtn(b, done) {
    b.classList.toggle('done', done);
    b.classList.remove('busy');
    b.querySelector('.arrow').setAttribute('d', done ? 'M11.5 17.5l3.5 3.5 7.5-8' : 'M17 11v10M13 17l4 4 4-4');
    b.setAttribute('aria-label', (done ? 'Remove download: ' : 'Download ') + FEATURES[b.dataset.dl].title);
  }
  function syncDL() {
    $$('.poster[data-f]', streamEl).forEach(p => p.classList.toggle('dl', downloaded.has(FEATURES[p.dataset.f].id)));
    $$('.dl-btn[data-dl]').forEach(b => setDlBtn(b, downloaded.has(FEATURES[b.dataset.dl].id)));
    const txt = $('#dlTxt');
    if (txt) txt.textContent = downloaded.has('downloads') ? 'Downloaded. It plays even with the Offline switch on.' : 'Tap the button to save this title to your device.';
    store.set('dl', Array.from(downloaded));
  }
  function toggleDownload(i, btn) {
    const f = FEATURES[i];
    if (offline) { toast('You’re offline. Connect to download.'); track(); return; }
    if (downloaded.has(f.id)) {
      downloaded.delete(f.id);
      syncDL();
      toast(`Removed ${f.title} from your downloads.`);
      return;
    }
    btn.classList.add('busy');
    setTimeout(() => {
      downloaded.add(f.id);
      syncDL();
      toast(`${f.title} downloaded. It will play offline.`);
    }, reduce ? 0 : 1300);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.dl-btn[data-dl]');
    if (b && !b.classList.contains('busy')) toggleDownload(Number(b.dataset.dl), b);
  });
  syncDL();

  function canPlay(i) {
    if (offline && !downloaded.has(FEATURES[i].id)) {
      toast(`${FEATURES[i].title} isn’t downloaded. Go online to watch it.`);
      track();
      return false;
    }
    track();
    return true;
  }
  $('#topTrack').addEventListener('click', e => {
    const p = e.target.closest('.poster');
    if (p && canPlay(Number(p.dataset.f))) openDetails(Number(p.dataset.f));
  });

  /* offline switch */
  $('#offlineToggle').addEventListener('change', e => {
    offline = e.target.checked;
    streamEl.classList.toggle('is-offline', offline);
    $('#offlineBanner').hidden = !offline;
    if (offline) {
      toast('Offline. Only downloaded titles will play, and analytics wait in a queue.');
    } else if (queued) {
      toast(`Back online. Sent ${queued} queued analytics event${queued === 1 ? '' : 's'}.`);
      queued = 0;
      $('#queued').textContent = '0';
    } else {
      toast('Back online.');
    }
  });

  /* billboard */
  const hexToRgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const BB = [0, 3, 2];
  const BB_DUR = 8000;
  let bbI = 0, bbTimer = 0;
  const bb = { cv: $('#bbCanvas'), cur: FEATURES[0].hues.map(hexToRgb), target: null, visible: false, raf: 0 };
  bb.ctx = bb.cv.getContext('2d');
  function bbResize() {
    const r = bb.cv.getBoundingClientRect();
    const s = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
    bb.cv.width = Math.max(1, Math.round(r.width * s));
    bb.cv.height = Math.max(1, Math.round(r.height * s));
  }
  function bbDraw(now) {
    const { ctx } = bb, w = bb.cv.width, h = bb.cv.height;
    if (bb.target) bb.cur = bb.cur.map((c, i) => c.map((v, j) => v + (bb.target[i][j] - v) * 0.04));
    const [a, b, c] = bb.cur.map(col => col.map(Math.round));
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgb(${c})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    const t = now / 1000;
    const lift = c.map(v => Math.min(255, v + 70));
    const orbs = [[a, .7, .3, .55, .21, 0], [b, .84, .62, .45, .17, 2], [a, .52, .78, .38, .13, 4], [b, .92, .18, .34, .25, 1], [lift, .62, .5, .6, .09, 3]];
    for (const [col, x, y, r, sp, ph] of orbs) {
      const cx = (x + Math.sin(t * sp + ph) * 0.08) * w;
      const cy = (y + Math.cos(t * sp * 1.3 + ph) * 0.1) * h;
      const rr = r * Math.max(w, h);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, `rgba(${col},.5)`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }
  function bbLoop(now) {
    bbDraw(now);
    bb.raf = bb.visible && !reduce ? requestAnimationFrame(bbLoop) : 0;
  }
  bbResize();
  bbDraw(0);
  window.addEventListener('resize', () => { bbResize(); bbDraw(performance.now()); tvResize(); });
  onVisible($('#st-top'), v => {
    bb.visible = v;
    if (v && !bb.raf && !reduce) bb.raf = requestAnimationFrame(bbLoop);
    if (v) scheduleBB(); else clearTimeout(bbTimer);
  });

  $('#bbDots').innerHTML = BB.map((fi, k) => `<button class="bb-dot" type="button" role="tab" data-k="${k}" aria-label="${esc(FEATURES[fi].title)}"><i></i></button>`).join('');
  $('#bbDots').style.setProperty('--bb-dur', BB_DUR + 'ms');
  function paintBB() {
    const f = FEATURES[BB[bbI]];
    $('#bbTitle').textContent = f.title;
    $('#bbDesc').textContent = f.desc;
    $('#bbTags').textContent = f.tags.join(' · ');
    $('#bbKey').innerHTML = ICONS[f.icon];
    $$('.bb-dot').forEach((d, k) => {
      d.classList.remove('on');
      d.classList.toggle('done', k < bbI);
      d.setAttribute('aria-selected', String(k === bbI));
    });
    const cur = $$('.bb-dot')[bbI];
    void cur.offsetWidth;
    if (reduce) cur.classList.add('done'); else cur.classList.add('on');
  }
  function setBB(k) {
    bbI = k;
    bb.target = FEATURES[BB[k]].hues.map(hexToRgb);
    if (reduce) { bb.cur = bb.target; bbDraw(0); paintBB(); return; }
    const sw = $('#bbSwap');
    sw.classList.add('swapping');
    setTimeout(() => { paintBB(); sw.classList.remove('swapping'); }, 320);
    scheduleBB();
  }
  function scheduleBB() {
    clearTimeout(bbTimer);
    if (reduce) return;
    bbTimer = setTimeout(() => setBB((bbI + 1) % BB.length), BB_DUR);
  }
  $('#bbDots').addEventListener('click', e => { const d = e.target.closest('.bb-dot'); if (d) setBB(Number(d.dataset.k)); });
  $('#bbPlay').addEventListener('click', () => { const i = BB[bbI]; if (canPlay(i)) play(i); });
  $('#bbInfo').addEventListener('click', () => { const i = BB[bbI]; track(); openDetails(i); });
  paintBB();

  /* live polling: the "watching now" concurrency counter */
  function makeConcurrency(el, withHeader) {
    const PEAK = 59e6, LO = 35e6, HI = 61e6, EVERY = 3000, KEEP = 36;
    const series = [];
    let v = 38e6;
    for (let i = 0; i < KEEP; i++) { v += rand(2e5, 5.5e5); series.push(v); }
    let shown = v, polls = KEEP - 1, tween = 0;
    const cr = n => (n / 1e7).toFixed(2) + ' Cr';
    const clock = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
    el.innerHTML = (withHeader
      ? '<div class="st-card-h"><span class="live-tag"><i></i>LIVE</span><h3>Live Polling</h3><span class="demo-tag">Demo</span></div>' +
        '<p class="st-card-sub">I built the polling service behind the live “watching now” count. During live matches and events it kept that number fresh at traffic peaks of around 59 million concurrent viewers.</p>'
      : '') +
      '<div class="cc">' +
      '<div class="cc-top"><p class="cc-count"><b data-num></b><span>watching now</span></p>' +
      '<p class="cc-poll"><span class="cc-ring" aria-hidden="true"><svg viewBox="0 0 20 20"><circle class="bg" cx="10" cy="10" r="8"/><circle class="fg" cx="10" cy="10" r="8"/></svg></span><span data-next>Polling every 3s</span></p></div>' +
      '<p class="cc-exact" data-exact></p>' +
      '<div class="cc-chart"><svg class="cc-spark" viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true"><path class="area"/><path class="line"/><path class="peak"/></svg>' +
      '<span class="cc-peak">≈59M peak</span><span class="cc-dot" aria-hidden="true"></span></div>' +
      '<ul class="cc-log" aria-hidden="true"></ul>' +
      '<p class="cc-foot">Simulated numbers, shaped like a big match night. The real peak was around 59 million.</p></div>';
    const num = $('[data-num]', el), exact = $('[data-exact]', el), log = $('.cc-log', el), ring = $('.cc-ring', el), dot = $('.cc-dot', el);
    ring.style.setProperty('--cc-int', EVERY + 'ms');
    const X = i => (i / (KEEP - 1)) * 300;
    const Y = n => 90 - ((n - LO) / (HI - LO)) * 90;
    function paintNum(n) {
      num.textContent = cr(n);
      exact.textContent = `${Math.round(n).toLocaleString('en-IN')} concurrent viewers · ≈${(n / 1e6).toFixed(1)} million`;
    }
    function paintChart() {
      const pts = series.slice(-KEEP);
      const off = KEEP - pts.length;
      const line = pts.map((n, i) => `${i ? 'L' : 'M'}${X(i + off).toFixed(1)},${Y(n).toFixed(1)}`).join(' ');
      $('.line', el).setAttribute('d', line);
      $('.area', el).setAttribute('d', `${line} L300,90 L${X(off).toFixed(1)},90 Z`);
      $('.peak', el).setAttribute('d', `M0,${Y(PEAK).toFixed(1)} L300,${Y(PEAK).toFixed(1)}`);
      $('.cc-peak', el).style.top = (Y(PEAK) / 90 * 100) + '%';
      dot.style.left = '100%';
      dot.style.top = (Y(pts[pts.length - 1]) / 90 * 100) + '%';
    }
    function addLog(n) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="t">${clock()}</span><span>poll #${polls}</span><span class="ok">200 OK</span><span>${cr(n)}</span>`;
      log.prepend(li);
      while (log.children.length > 3) log.lastChild.remove();
    }
    function poll() {
      if (document.hidden) return;
      polls++;
      const last = series[series.length - 1];
      const next = last < PEAK - 8e5 ? last + rand(1.5e5, 6e5) : Math.min(PEAK, last + rand(-3.5e5, 3e5));
      series.push(next);
      if (series.length > KEEP) series.shift();
      paintChart();
      addLog(next);
      ring.classList.remove('go');
      void ring.offsetWidth;
      if (!reduce) ring.classList.add('go');
      const from = shown, t0 = performance.now();
      cancelAnimationFrame(tween);
      if (reduce) { shown = next; paintNum(next); return; }
      const step = now => {
        const k = Math.min(1, (now - t0) / 900);
        shown = from + (next - from) * (1 - Math.pow(1 - k, 3));
        paintNum(shown);
        if (k < 1) tween = requestAnimationFrame(step);
      };
      tween = requestAnimationFrame(step);
    }
    paintNum(shown);
    paintChart();
    addLog(shown);
    if (!reduce) ring.classList.add('go');
    const iv = setInterval(poll, EVERY);
    return () => { clearInterval(iv); cancelAnimationFrame(tween); };
  }
  makeConcurrency($('#st-live'), true);

  /* endless trailer feed */
  function makeFeed(el) {
    el.innerHTML = '<div class="phone"><div class="feed" tabindex="0" aria-label="Hot and New trailer feed"></div></div>';
    const feed = $('.feed', el);
    const addRound = () => FEATURES.forEach(f => {
      const d = document.createElement('div');
      d.className = 'trailer';
      d.style.cssText = artVars(f);
      d.innerHTML = `<span class="prog"><i></i></span><span class="soon">TRAILER</span><b>${esc(f.title)}</b><small>${f.tagline}</small><span class="remind">+ Remind me</span>`;
      feed.appendChild(d);
    });
    addRound();
    addRound();
    let idx = 0, paused = false, timer = 0;
    const mark = () => Array.from(feed.children).forEach((c, i) => c.classList.toggle('playing', i === idx));
    const step = () => {
      if (paused || document.hidden) return;
      idx++;
      if (idx >= feed.children.length - 3) addRound();
      feed.scrollTo({ top: idx * feed.clientHeight, behavior: reduce ? 'auto' : 'smooth' });
      mark();
    };
    feed.addEventListener('scroll', () => {
      const i = Math.round(feed.scrollTop / Math.max(1, feed.clientHeight));
      if (i !== idx) {
        idx = i;
        mark();
        if (idx >= feed.children.length - 3) addRound();
      }
    }, { passive: true });
    feed.addEventListener('pointerenter', () => { paused = true; });
    feed.addEventListener('pointerleave', () => { paused = false; });
    feed.addEventListener('focusin', () => { paused = true; });
    feed.addEventListener('focusout', () => { paused = false; });
    mark();
    if (!reduce) timer = setInterval(step, 3000);
    return () => clearInterval(timer);
  }
  const stNew = $('#st-new');
  stNew.innerHTML = '<div><div class="st-card-h"><h3>New &amp; Hot</h3><span class="demo-tag">Demo</span></div>' +
    '<p class="st-card-sub">An endless, auto-playing feed of trailers for upcoming shows and movies. I built it to help people discover what’s coming.</p>' +
    '<p class="st-card-sub">This one never runs out either. Scroll it, or let it play.</p></div><div data-feed></div>';
  makeFeed($('[data-feed]', stNew));

  /* details modal + per-feature demos */
  let demoCleanup = null;
  const stM = modal($('#stDetails'), { onClose: () => { if (demoCleanup) demoCleanup(); demoCleanup = null; } });
  const DEMOS = {
    downloads(box, i) {
      box.innerHTML = `<div class="dl-demo"><button class="dl-btn" type="button" data-dl="${i}">${DL_SVG}</button><p id="dlTxt"></p></div>`;
      syncDL();
      return null;
    },
    offline(box) {
      const EV = ['app_open', 'play_start · Downloads', 'seek · 00:12:40', 'pause', 'play_resume', 'download_complete', 'play_end'];
      let online = false, k = 0;
      box.innerHTML = '<div class="seg" role="group" aria-label="Connection"><button type="button" data-net="on">Online</button><button type="button" data-net="off" class="on">Offline</button></div><ul class="evt-log" aria-live="off"></ul>';
      const log = $('.evt-log', box);
      const add = () => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${EV[k++ % EV.length]}</span><span class="st ${online ? 's' : 'q'}">${online ? 'sent' : 'queued'}</span>`;
        log.prepend(li);
        while (log.children.length > 6) log.lastChild.remove();
      };
      add();
      box.addEventListener('click', e => {
        const b = e.target.closest('[data-net]');
        if (!b) return;
        online = b.dataset.net === 'on';
        $$('[data-net]', box).forEach(x => x.classList.toggle('on', x === b));
        if (online) $$('.st.q', log).forEach((s, n) => setTimeout(() => { s.className = 'st s'; s.textContent = 'sent'; }, n * 160));
      });
      const iv = setInterval(add, 1500);
      return () => clearInterval(iv);
    },
    hotnew(box) {
      box.innerHTML = '<div style="display:grid;place-items:center"></div>';
      return makeFeed(box.firstChild);
    },
    polls(box) { return makeConcurrency(box, false); },
    onboarding(box) {
      const L = ['English', 'हिन्दी', 'தமிழ்', 'తెలుగు', 'বাংলা', 'मराठी', 'ಕನ್ನಡ', 'മലയാളം'];
      const K = ['Movies', 'Shows', 'Sports', 'Kids', 'News'];
      const sel = new Set(['English', 'हिन्दी']), kinds = new Set(['Sports']);
      box.innerHTML = '<p class="std-demo-h" style="margin-bottom:8px">Pick your languages</p><div class="langs" data-g="l">' +
        L.map(l => `<button type="button" class="lang" data-v="${l}" aria-pressed="false">${l}</button>`).join('') +
        '</div><p class="std-demo-h" style="margin-bottom:8px">What do you like?</p><div class="langs" data-g="k">' +
        K.map(l => `<button type="button" class="lang" data-v="${l}" aria-pressed="false">${l}</button>`).join('') +
        '</div><p class="home-ready" data-ready></p>';
      const paint = () => {
        $$('[data-g="l"] .lang', box).forEach(b => { const on = sel.has(b.dataset.v); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
        $$('[data-g="k"] .lang', box).forEach(b => { const on = kinds.has(b.dataset.v); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
        $('[data-ready]', box).innerHTML = sel.size
          ? `Your home screen opens with <b>${Array.from(kinds).join(', ') || 'a bit of everything'}</b> in <b>${Array.from(sel).join(', ')}</b>.`
          : 'Pick at least one language to continue.';
      };
      box.addEventListener('click', e => {
        const b = e.target.closest('.lang');
        if (!b) return;
        const set = b.parentElement.dataset.g === 'l' ? sel : kinds;
        if (set.has(b.dataset.v)) set.delete(b.dataset.v); else set.add(b.dataset.v);
        paint();
      });
      paint();
      return null;
    },
    arch(box) {
      box.innerHTML = '<div class="viper"><span>View<em>renders</em></span><span>Presenter<em>formats</em></span><span>Interactor<em>business logic</em></span><span>Entity<em>models</em></span><span>Router<em>navigation</em></span></div>' +
        '<p class="viper-note">VIPER splits each screen into five small, testable parts. Server-driven UI lets the server send the layout:</p>' +
        '<div class="sdui"><pre>{\n  "type": "tray",\n  "title": "Hot &amp; New",\n  "style": "landscape",\n  "items": 3\n}</pre>' +
        '<div class="sdui-out" aria-hidden="true"><b>Hot &amp; New</b><div><i style="--a:#FF5A36;--b:#FF2D87"></i><i style="--a:#1E5BFF;--b:#19C3E6"></i><i style="--a:#16C47F;--b:#14A3B8"></i></div></div></div>';
      return null;
    }
  };
  function openDetails(i) {
    const f = FEATURES[i];
    if (demoCleanup) demoCleanup();
    $('#stDialog').innerHTML =
      `<div class="std-art" style="${artVars(f)}"><button class="std-x" type="button" data-close aria-label="Close">×</button>` +
      `<span class="pico" aria-hidden="true">${ICONS[f.icon]}</span><h3 id="stdTitle">${esc(f.title)}</h3>` +
      `<div class="bb-actions"><button class="btn-play" type="button" data-play="${i}">${PLAY_SVG}Play</button></div></div>` +
      `<div class="std-body"><div><p class="std-meta"><span class="shipped">SHIPPED</span>2021–2024 <span class="dot">·</span> iOS <span class="dot">·</span> ${f.tagline}</p>` +
      `<p class="std-desc">${f.desc}</p></div><div class="std-side"><p class="impact">${f.impact}</p>` +
      `<p><b>Tags</b> ${f.tags.join(', ')}</p><p><b>Company</b> Disney+ Hotstar</p><p><b>Role</b> Software Development Engineer II, iOS</p></div></div>` +
      `<div class="std-demo"><p class="std-demo-h">Try it <span class="demo-tag">Demo</span></p><div class="demo-box" id="demoBox"></div></div>`;
    demoCleanup = DEMOS[f.id]($('#demoBox'), i);
    $('#stDialog').scrollTop = 0;
    stM.open('.std-x');
  }
  $('#stDialog').addEventListener('click', e => {
    const p = e.target.closest('[data-play]');
    if (!p) return;
    const i = Number(p.dataset.play);
    if (!canPlay(i)) return;
    stM.close();
    play(i);
  });

  /* player */
  const PL_DUR = 12;
  const playerEl = $('#player');
  let plI = 0, plT = 0, plPlaying = false, plLast = 0, plRaf = 0, plWords = [], plChunk = -1, plShown = -1, cdTimer = 0;
  const pl = modal(playerEl, { onClose: () => { cancelAnimationFrame(plRaf); clearInterval(cdTimer); plPlaying = false; } });
  const fmt = s => `0:${String(Math.floor(s)).padStart(2, '0')}`;
  function restartTitle() {
    const t = $('#plTitle');
    t.style.animation = 'none';
    void t.offsetWidth;
    t.style.animation = '';
  }
  function play(i) {
    plI = i;
    const f = FEATURES[i];
    playerEl.style.cssText = artVars(f);
    $('#plTitle').textContent = f.title;
    $('#plKey').innerHTML = ICONS[f.icon];
    $('#plTopTitle').textContent = `${f.title} · Disney+ Hotstar`;
    plWords = f.desc.split(' ');
    plT = 0; plChunk = -1; plShown = -1;
    $('#plCC').innerHTML = '';
    $('#plNext').hidden = true;
    clearInterval(cdTimer);
    restartTitle();
    if (!pl.isOpen()) pl.open('#plToggle');
    setPlaying(true);
  }
  function setPlaying(on) {
    plPlaying = on;
    $('#plToggleIcon').setAttribute('d', on ? 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z' : 'M8 5v14l11-7z');
    $('#plToggle').setAttribute('aria-label', on ? 'Pause' : 'Play');
    cancelAnimationFrame(plRaf);
    if (on) { plLast = performance.now(); plRaf = requestAnimationFrame(plTick); }
  }
  function plTick(now) {
    plT = Math.min(PL_DUR, plT + (now - plLast) / 1000);
    plLast = now;
    paintPl();
    if (plT >= PL_DUR) { setPlaying(false); showNext(); return; }
    plRaf = requestAnimationFrame(plTick);
  }
  function paintPl() {
    const p = plT / PL_DUR;
    $('#plFill').style.width = (p * 100) + '%';
    $('#plKnob').style.left = (p * 100) + '%';
    $('#plScrub').setAttribute('aria-valuenow', String(Math.round(p * 100)));
    $('#plTime').textContent = `${fmt(plT)} / ${fmt(PL_DUR)}`;
    const per = 9;
    const n = Math.max(0, Math.min(plWords.length, Math.ceil(plWords.length * (plT - 1.1) / (PL_DUR * 0.8))));
    if (n === plShown) return;
    plShown = n;
    if (!n) { $('#plCC').innerHTML = ''; return; }
    const chunk = Math.floor((n - 1) / per);
    plChunk = chunk;
    $('#plCC').innerHTML = `<span>${plWords.slice(chunk * per, chunk * per + per).join(' ')}</span>`;
  }
  function showNext() {
    const next = (plI + 1) % FEATURES.length;
    $('#plNextTitle').textContent = FEATURES[next].title;
    $('#plNext').hidden = false;
    let c = 5;
    $('#plCount').textContent = c;
    clearInterval(cdTimer);
    cdTimer = setInterval(() => {
      c--;
      $('#plCount').textContent = c;
      if (c <= 0) { clearInterval(cdTimer); play(next); }
    }, 1000);
  }
  $('#plToggle').addEventListener('click', () => {
    if (plT >= PL_DUR) { plT = 0; plShown = -1; $('#plNext').hidden = true; clearInterval(cdTimer); restartTitle(); }
    setPlaying(!plPlaying);
  });
  $('#plRestart').addEventListener('click', () => { plT = 0; plShown = -1; $('#plNext').hidden = true; clearInterval(cdTimer); restartTitle(); setPlaying(true); });
  $('#plSkip').addEventListener('click', () => play((plI + 1) % FEATURES.length));
  $('#plNextGo').addEventListener('click', () => play((plI + 1) % FEATURES.length));
  $('#plNextCancel').addEventListener('click', () => { clearInterval(cdTimer); $('#plNext').hidden = true; });
  $('#plCCBtn').addEventListener('click', e => {
    const on = !e.currentTarget.classList.contains('on');
    e.currentTarget.classList.toggle('on', on);
    e.currentTarget.setAttribute('aria-pressed', String(on));
    playerEl.classList.toggle('cc-off', !on);
  });
  const seekTo = p => {
    plT = Math.max(0, Math.min(PL_DUR - 0.05, p * PL_DUR));
    plShown = -1;
    $('#plNext').hidden = true;
    clearInterval(cdTimer);
    paintPl();
  };
  $('#plScrub').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); seekTo((e.clientX - r.left) / r.width); });
  $('#plScrub').addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { seekTo((plT + 1) / PL_DUR); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { seekTo((plT - 1) / PL_DUR); e.preventDefault(); }
  });
  document.addEventListener('keydown', e => {
    if (stack[stack.length - 1] === pl && e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); setPlaying(!plPlaying); }
  });

  /* =========================================================
     NEWS (To The New)
     ========================================================= */
  const STORIES = [
    {
      time: '18:00', slug: 'LEAD · LIVE NEWS APP', tag: 'BREAKING',
      head: '24×7 business news app reaches 100,000+ listeners in Australia',
      sub: 'Live news, on-demand video and live interviews, around the clock',
      text: 'Worked on a live business news app with 24×7 news, on-demand videos and live interviews for more than 100,000 business listeners in Australia.'
    },
    {
      time: '18:08', slug: 'TECH · FROM SCRATCH', tag: 'TECH DESK',
      head: 'Team of three builds the app from scratch on MVVM',
      sub: 'Rajat Tyagi one of three developers on the build',
      text: 'Developed the app from scratch with a team of 3 developers, using MVVM as the architectural pattern.'
    },
    {
      time: '18:15', slug: 'PEOPLE · SWIFTUI', tag: 'PEOPLE',
      head: 'Engineer hosts SwiftUI Knowledge Meet',
      sub: 'Also mentors junior engineers on iOS fundamentals',
      text: 'Gave a Knowledge Meet on SwiftUI and mentored junior engineers on iOS development fundamentals.'
    }
  ];
  $('#rundown').innerHTML = STORIES.map((s, i) =>
    `<li><button class="ro" type="button" data-s="${i}" aria-pressed="false"><span class="ro-time">${s.time}</span>` +
    `<span class="ro-slug">${s.slug}<span class="ro-state">READY</span></span><span class="ro-text">${s.text}</span></button></li>`
  ).join('');
  let sIdx = 0, sHold = 0;
  function setStory(i, manual) {
    sIdx = i;
    const s = STORIES[i];
    const hl = $('#tvHl');
    hl.classList.remove('wipe');
    void hl.offsetWidth;
    if (!reduce) hl.classList.add('wipe');
    $('#tvBreak').textContent = s.tag;
    $('#tvHead').textContent = s.head;
    $('#tvSub').textContent = s.sub;
    $$('.ro').forEach((r, k) => {
      const on = k === i;
      r.classList.toggle('on', on);
      r.setAttribute('aria-pressed', String(on));
      r.querySelector('.ro-state').textContent = on ? 'ON AIR' : (k === (i + 1) % STORIES.length ? 'NEXT' : 'READY');
    });
    if (manual) sHold = Date.now() + 20000;
  }
  $('#rundown').addEventListener('click', e => { const r = e.target.closest('.ro'); if (r) setStory(Number(r.dataset.s), true); });
  setStory(0);
  if (!reduce) setInterval(() => { if (Date.now() > sHold && !document.hidden) setStory((sIdx + 1) % STORIES.length); }, 7000);

  const TICK = [
    ['LISTENERS', '100,000+', 1], ['COVERAGE', '24×7 LIVE', 0], ['ON-DEMAND VIDEO', 'ADDED', 1], ['LIVE INTERVIEWS', 'ON AIR', 0],
    ['TEAM', '3 DEVELOPERS', 0], ['ARCHITECTURE', 'MVVM', 1], ['BUILD', 'FROM SCRATCH', 1], ['SWIFTUI', 'KNOWLEDGE MEET', 1],
    ['MENTORING', 'JUNIOR iOS ENGINEERS', 1], ['DESK', 'NOIDA', 0], ['ON AIR', 'FEB 2020 – SEP 2021', 0]
  ];
  const tk = TICK.map(([k, v, up]) => `<span><b>${k}</b>${v}${up ? ' <i class="up">▲</i>' : ''}</span>`).join('');
  $('#tkTrack').innerHTML = tk + tk;

  function tickClock() {
    try {
      const d = new Date();
      const t = new Intl.DateTimeFormat('en-GB', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
      const z = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', timeZoneName: 'short' }).formatToParts(d).find(p => p.type === 'timeZoneName');
      $('#tvClock').textContent = `SYDNEY ${t} ${z ? z.value : ''}`.trim();
    } catch (e) {
      $('#tvClock').textContent = 'SYDNEY';
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* market-style chart behind the anchor desk */
  const tv = { cv: $('#tvChart'), pts: [], visible: false, last: 0, raf: 0 };
  tv.ctx = tv.cv.getContext('2d');
  (() => { let v = 40; for (let i = 0; i < 70; i++) { v += rand(-2.2, 3); tv.pts.push(v); } })();
  function tvResize() {
    const r = tv.cv.getBoundingClientRect();
    const s = Math.min(window.devicePixelRatio || 1, 2);
    tv.cv.width = Math.max(1, Math.round(r.width * s));
    tv.cv.height = Math.max(1, Math.round(r.height * s));
    tvDraw();
  }
  function tvDraw() {
    const { ctx, pts } = tv, w = tv.cv.width, h = tv.cv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(157,176,216,.12)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= 12; gx++) { const x = (gx / 12) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let gy = 0; gy <= 6; gy++) { const y = (gy / 6) * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    const min = Math.min(...pts), max = Math.max(...pts);
    const top = h * 0.2, bot = h * 0.52;
    const X = i => w * 0.3 + (i / (pts.length - 1)) * w * 0.66;
    const Y = v => bot - ((v - min) / Math.max(1, max - min)) * (bot - top);
    const gold = css('--nw-gold') || '#FFC233';
    const grad = ctx.createLinearGradient(0, top, 0, bot + h * 0.2);
    grad.addColorStop(0, 'rgba(255,194,51,.28)');
    grad.addColorStop(1, 'rgba(255,194,51,0)');
    ctx.beginPath();
    pts.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
    ctx.lineTo(X(pts.length - 1), bot + h * 0.2);
    ctx.lineTo(X(0), bot + h * 0.2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    pts.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
    ctx.strokeStyle = gold;
    ctx.lineWidth = Math.max(1.5, w / 500);
    ctx.lineJoin = 'round';
    ctx.stroke();
    const ex = X(pts.length - 1), ey = Y(pts[pts.length - 1]);
    ctx.fillStyle = gold;
    ctx.beginPath(); ctx.arc(ex, ey, Math.max(3, w / 220), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,194,51,.25)';
    ctx.beginPath(); ctx.arc(ex, ey, Math.max(7, w / 90), 0, Math.PI * 2); ctx.fill();
  }
  function tvLoop(now) {
    if (now - tv.last > 900) {
      tv.last = now;
      const lastV = tv.pts[tv.pts.length - 1];
      tv.pts.push(lastV + rand(-2.4, 3));
      tv.pts.shift();
      tvDraw();
    }
    tv.raf = tv.visible ? requestAnimationFrame(tvLoop) : 0;
  }
  tvResize();
  onVisible($('#tv'), v => {
    tv.visible = v;
    if (v && !tv.raf && !reduce) tv.raf = requestAnimationFrame(tvLoop);
  });

  /* =========================================================
     APP STORE (side projects)
     ========================================================= */
  const ICON_SVG = {
    notch: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#0E0E11"/><rect x="15" y="7" width="30" height="10" rx="5" fill="#000" stroke="#3A3A44"/><rect x="12" y="25" width="36" height="3.5" rx="1.75" fill="#55555E"/><rect x="12" y="33" width="36" height="3.5" rx="1.75" fill="#F2B43A"/><rect x="12" y="41" width="26" height="3.5" rx="1.75" fill="#55555E"/></svg>',
    insight: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#0F766E"/><g fill="#fff"><rect x="10" y="26" width="3.5" height="8" rx="1.75"/><rect x="16" y="20" width="3.5" height="20" rx="1.75"/><rect x="22" y="14" width="3.5" height="32" rx="1.75"/><rect x="28" y="22" width="3.5" height="16" rx="1.75"/><rect x="34" y="17" width="3.5" height="26" rx="1.75"/><rect x="40" y="23" width="3.5" height="14" rx="1.75"/><rect x="46" y="27" width="3.5" height="6" rx="1.75"/></g><circle cx="46" cy="14" r="5" fill="#5EEAD4"/></svg>',
    honey: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#FFC93C"/><path d="M30 11 46 20v18L30 47 14 38V20z" fill="#FFE08A" stroke="#7A4A00" stroke-width="3" stroke-linejoin="round"/><path d="M22.5 29.5l5.5 5.5 10-11" fill="none" stroke="#7A4A00" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    biodex: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#E2402F"/><rect x="38" y="9" width="12" height="5" rx="2.5" fill="#FFB4A8"/><circle cx="30" cy="32" r="16" fill="#fff"/><circle cx="30" cy="32" r="10" fill="#1F2937"/><circle cx="30" cy="32" r="4.5" fill="#4ADE80"/><circle cx="34" cy="28" r="2" fill="#fff"/></svg>',
    splitty: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#10B981"/><path d="M27.5 13a17 17 0 0 0 0 34z" fill="#fff"/><path d="M32.5 13a17 17 0 0 1 0 34z" fill="#D1FAE5"/></svg>',
    spend: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#1E3A8A"/><rect x="9" y="15" width="32" height="22" rx="4" fill="#93C5FD"/><rect x="9" y="20" width="32" height="4" fill="#1E3A8A"/><circle cx="38" cy="38" r="9" fill="#1E3A8A" stroke="#fff" stroke-width="3.5"/><path d="M44.5 44.5 50 50" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>',
    folio: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#F97316"/><rect x="13" y="20" width="26" height="28" rx="4" fill="#FED7AA"/><rect x="20" y="12" width="27" height="29" rx="4" fill="#fff"/><circle cx="33.5" cy="22" r="4.5" fill="#F97316"/><rect x="25" y="30" width="17" height="3" rx="1.5" fill="#FDBA74"/><rect x="25" y="35" width="11" height="3" rx="1.5" fill="#FDBA74"/></svg>',
    coin: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#0F172A"/><circle cx="25" cy="34" r="13" fill="#F59E0B"/><circle cx="35" cy="26" r="13" fill="#FCD34D" stroke="#0F172A" stroke-width="2.5"/><circle cx="35" cy="26" r="7" fill="none" stroke="#B45309" stroke-width="2.5"/></svg>',
    aa: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#F3F4F6"/><g stroke="#111827" stroke-width="1.6"><path d="M30 25 48 25M30 25 39 40.6M30 25 21 40.6M30 25 12 25M30 25 21 9.4M30 25 39 9.4"/></g><g fill="#111827"><circle cx="48" cy="25" r="2.6"/><circle cx="39" cy="40.6" r="2.6"/><circle cx="21" cy="40.6" r="2.6"/><circle cx="12" cy="25" r="2.6"/><circle cx="21" cy="9.4" r="2.6"/><circle cx="39" cy="9.4" r="2.6"/><circle cx="30" cy="25" r="8"/><circle cx="30" cy="53" r="2.6"/></g><path d="M30 46v5" stroke="#111827" stroke-width="1.6"/></svg>',
    panda: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#FAFAFA"/><circle cx="16" cy="17" r="7" fill="#111"/><circle cx="44" cy="17" r="7" fill="#111"/><circle cx="30" cy="33" r="17" fill="#fff" stroke="#111" stroke-width="2"/><ellipse cx="23" cy="31" rx="4" ry="5" fill="#111"/><ellipse cx="37" cy="31" rx="4" ry="5" fill="#111"/><circle cx="23.5" cy="30" r="1.3" fill="#fff"/><circle cx="36.5" cy="30" r="1.3" fill="#fff"/><ellipse cx="30" cy="40" rx="3" ry="2" fill="#111"/></svg>'
  };
  const SCRIPT = ['Good morning, everyone.', 'Thanks for joining the demo.', 'Today I’ll walk you through', '<b>what we shipped this quarter</b>', 'and what comes next.', 'Let’s start with the numbers.'];
  const ART = {
    'art-notch': () => `<span class="lid"></span><span class="island"><span class="cam"></span><span class="isv"><span class="script">${SCRIPT.concat(SCRIPT).map(l => `<span>${l}</span>`).join('')}</span></span></span>` +
      `<span class="wave">${Array.from({ length: 9 }, (_, i) => `<i style="animation-delay:-${(i * 0.17).toFixed(2)}s"></i>`).join('')}</span>`,
    'art-insight': () => `<span class="bars">${Array.from({ length: 42 }, (_, i) => `<i style="animation-delay:-${((i * 0.29) % 1.1).toFixed(2)}s;animation-duration:${(0.8 + (i % 5) * 0.12).toFixed(2)}s"></i>`).join('')}</span>` +
      '<span class="chips"><span>Greeting ✓</span><span>Compliance ✓</span><span>Resolution ✓</span></span>'
  };
  const PROJECTS = {
    f0: {
      name: 'NotchCue', eyebrow: 'App of the day', headline: 'Your script, right under the camera.', icon: 'notch', art: 'art-notch',
      sub: 'A teleprompter that lives in your MacBook’s notch', platform: 'macOS', category: 'Productivity', year: '2026',
      desc: [
        'A native macOS teleprompter that blends into the notch at the top of a MacBook screen, so your script sits right under the camera.',
        'It scrolls in time with your voice, karaoke-style, and keeps the script private while you share your screen.'
      ],
      points: ['Voice-synced scrolling using Apple’s Speech framework, with jump protection and smooth easing', 'Script stays hidden during screen sharing', 'Notch mode, plus a floating-window fallback', 'Script editor, countdown and an onboarding tour', 'Trial, licensing and Sparkle auto-updates', 'Marketing site built with React and Tailwind'],
      stack: ['Swift', 'SwiftUI', 'AppKit', 'Speech', 'AVFoundation', 'Sparkle']
    },
    f1: {
      name: 'InsightStream AI', eyebrow: 'Built for teams', headline: 'Every call, scored against your rubric.', icon: 'insight', art: 'art-insight',
      sub: 'AI call-quality analysis for teams', platform: 'Web', category: 'Business', year: '2026',
      desc: ['A multi-tenant platform that ingests call audio and metadata, scores each call with an LLM against configurable rubrics, and shows the results in dashboards and APIs.'],
      points: ['Rubric studio for writing scoring criteria', 'WYSIWYG dashboard builder', 'Synced transcript with real audio playback', 'Live call monitor and pipeline controls', 'Tenant auth and workspaces', 'Batch processing with Gemini'],
      stack: ['React', 'TypeScript', 'Vite', 'Java', 'Quarkus', 'Gemini']
    },
    m0: {
      name: 'HoneyDoo', icon: 'honey', sub: 'Turn chores into treats', platform: 'iOS', category: 'Lifestyle', year: '2025',
      desc: ['A shared space where couples split everyday tasks and chores. One partner creates the space and the other joins with a code.', 'Built with offline indicators, sync status, clear error states and notifications.'],
      points: ['Shared tasks and chores for two', 'Join your partner with a code', 'Offline indicators and sync status', 'Notifications'],
      stack: ['SwiftUI', 'Supabase', 'UserNotifications']
    },
    m1: {
      name: 'BioDex', icon: 'biodex', sub: 'A field guide that talks back', platform: 'iOS · Flutter', category: 'Education', year: '2026',
      desc: ['Point the camera at a creature and BioDex identifies it with Gemini, then reads its entry aloud, like the handheld encyclopedias from the games.', 'Built first in SwiftUI with an 8-bit loading animation, then ported to Flutter.'],
      points: ['Camera identification with Gemini', 'Spoken entries with text-to-speech', 'Retro 8-bit loading animation', 'SwiftUI app and a Flutter port'],
      stack: ['SwiftUI', 'AVFoundation', 'Flutter', 'Gemini', 'Supabase']
    },
    m2: {
      name: 'Splitty', icon: 'splitty', sub: 'Split group expenses without the awkward maths', platform: 'Android · iOS', category: 'Finance', year: '2025',
      desc: ['A Flutter expense-splitting app for groups.', 'Supports equal, exact, percentage and itemized splits, settlements, CSV import, statistics with monthly trends, and dark mode.'],
      points: ['Equal, exact, percentage and itemized splits', 'Group and personal statistics with trend charts', 'CSV import, including settlements', 'Per-group currencies and dark mode'],
      stack: ['Flutter', 'BLoC', 'Firebase', 'Hive', 'go_router']
    },
    m3: {
      name: 'SpendLens', icon: 'spend', sub: 'Make sense of your card statements', platform: 'Web · Mobile', category: 'Finance', year: '2026',
      desc: ['Upload credit-card statements and SpendLens reads the PDFs with Gemini, categorizes every transaction and shows where the money goes.', 'Includes category trends, transaction filters, credit-card views and duplicate detection.'],
      points: ['Statement PDF and CSV parsing with Gemini', 'Category trends over time', 'Duplicate detection', 'Web app and a mobile app in one repo'],
      stack: ['React', 'TypeScript', 'Vite', 'Supabase', 'Gemini']
    },
    e0: {
      name: 'SwiftUI Portfolio App', icon: 'folio', sub: 'Portfolio app with user authentication', platform: 'iOS · macOS', category: 'Early work', year: '2021',
      desc: ['A portfolio app written in SwiftUI with user authentication, with iOS and macOS targets.'], stack: ['SwiftUI'],
      repo: 'https://github.com/rajattyaagii/SwiftUI-Portfolio-App'
    },
    e1: {
      name: 'CoinExchangeRates', icon: 'coin', sub: 'Coin exchange rates in Flutter', platform: 'Android · iOS', category: 'Early work', year: '2020',
      desc: ['A Flutter project for coin exchange rates.'], stack: ['Flutter', 'Dart'],
      repo: 'https://github.com/rajattyaagii/CoinExchangeRates'
    },
    e2: {
      name: 'AA Game', icon: 'aa', sub: 'An arcade game built in Unity', platform: 'Unity', category: 'Early work', year: '2018',
      desc: ['An arcade game built in Unity and written in C#.'], stack: ['Unity', 'C#'],
      repo: 'https://github.com/rajattyaagii/AA-Game'
    },
    e3: {
      name: 'whitepanda', icon: 'panda', sub: 'A static site, live on GitHub Pages', platform: 'Web', category: 'Early work', year: '2019',
      desc: ['A static website built with HTML and CSS. It is still live at rajattyaagii.github.io/whitepanda.'], stack: ['HTML', 'CSS'],
      repo: 'https://github.com/rajattyaagii/whitepanda'
    }
  };
  const appIcon = k => `<span class="ai" aria-hidden="true">${ICON_SVG[k]}</span>`;

  $('#apDate').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#apFeatured').innerHTML = ['f0', 'f1'].map(k => {
    const p = PROJECTS[k];
    return `<button class="ap-card" type="button" data-p="${k}"><span class="art ${p.art}" aria-hidden="true">${ART[p.art]()}</span>` +
      `<span class="ap-card-top"><span class="ap-eyebrow">${p.eyebrow}</span><span class="ap-card-title">${p.headline}</span></span>` +
      `<span class="ap-card-bar">${appIcon(p.icon)}<span class="meta"><b>${p.name}</b><small>${p.sub}</small></span><span class="ap-get">VIEW</span></span></button>`;
  }).join('');
  const row = k => {
    const p = PROJECTS[k];
    const btn = p.repo
      ? `<a class="ap-get" href="${p.repo}" target="_blank" rel="noopener" aria-label="View ${p.name} on GitHub">VIEW</a>`
      : `<button class="ap-get locked" type="button" data-p="${k}" aria-label="${p.name}: private repo, show details">PRIVATE</button>`;
    return `<li class="ap-row"><button class="ap-row-btn" type="button" data-p="${k}">${appIcon(p.icon)}` +
      `<span><b>${p.name}</b><span class="sub">${p.sub}</span><span class="stk">${p.platform} · ${p.stack.slice(0, 3).join(', ')}</span></span></button>${btn}</li>`;
  };
  $('#apMore').innerHTML = ['m0', 'm1', 'm2', 'm3'].map(row).join('');
  $('#apEarly').innerHTML = ['e0', 'e1', 'e2', 'e3'].map(row).join('');

  const apM = modal($('#apWrap'));
  function sheetHTML(p) {
    return `<button class="aps-x${p.art ? '' : ' on-light'}" type="button" data-close aria-label="Close">×</button>` +
      (p.art ? `<div class="aps-art"><span class="art ${p.art}" aria-hidden="true">${ART[p.art]()}</span></div>` : '') +
      `<div class="aps-body"><div class="aps-app">${appIcon(p.icon)}<div><h3 id="apsTitle">${p.name}</h3><p>${p.sub}</p>` +
      (p.repo ? `<a class="ap-get" href="${p.repo}" target="_blank" rel="noopener">VIEW ON GITHUB</a>` : '<span class="ap-get locked">PRIVATE REPO</span>') +
      `</div></div><div class="aps-facts"><div><small>Platform</small><b>${p.platform}</b></div><div><small>Category</small><b>${p.category}</b></div><div><small>Year</small><b>${p.year}</b></div></div>` +
      `<div class="aps-desc">${p.desc.map(d => `<p>${d}</p>`).join('')}</div>` +
      (p.points ? `<h4 class="aps-sub">What’s inside</h4><ul class="aps-points">${p.points.map(x => `<li>${x}</li>`).join('')}</ul>` : '') +
      `<h4 class="aps-sub">Built with</h4><div class="aps-stack">${p.stack.map(s => `<span>${s}</span>`).join('')}</div>` +
      `<p class="aps-note">${p.repo ? 'The source is public on GitHub.' : 'The source lives in a private GitHub repo. Ask me for a walkthrough or a demo build.'}</p></div>`;
  }
  function openApp(k, src) {
    const sheet = $('#apSheet');
    sheet.innerHTML = sheetHTML(PROJECTS[k]);
    sheet.scrollTop = 0;
    apM.open('.aps-x');
    if (reduce || !src || !sheet.animate) return;
    requestAnimationFrame(() => {
      const a = src.getBoundingClientRect(), b = sheet.getBoundingClientRect();
      if (!b.width || !b.height) return;
      sheet.animate([
        { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`, transformOrigin: 'top left', opacity: 0.4 },
        { transform: 'none', transformOrigin: 'top left', opacity: 1 }
      ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }
  $('#projects').addEventListener('click', e => {
    const t = e.target.closest('[data-p]');
    if (!t) return;
    const src = t.closest('.ap-card') || t.closest('.ap-row') || t;
    openApp(t.dataset.p, src);
  });
})();

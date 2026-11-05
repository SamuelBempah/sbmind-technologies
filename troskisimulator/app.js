/* Troski Simulator site: XP bar, hidden cedi coins, achievements, mode picker, radar map, 4K gallery */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- saved progress ---------- */
  const KEY = 'troski_site_v1';
  const blank = { coins: [], dl: [], modes: [], pins: [], views: [], honk: 0, muted: false, shown: [] };
  let S;
  try { S = Object.assign({}, blank, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = Object.assign({}, blank); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } };
  const addTo = (arr, v) => { if (!S[arr].includes(v)) { S[arr].push(v); return true; } return false; };

  /* ---------- sound (tiny synth, no files) ---------- */
  let ac;
  const ctx = () => { if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); } if (ac && ac.state === 'suspended') ac.resume(); return ac; };
  function tone(freq, dur, type, vol, when) {
    if (S.muted) return; const a = ctx(); if (!a) return;
    const t = a.currentTime + (when || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square'; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const honk = () => { tone(392, 0.28, 'sawtooth', 0.09); tone(494, 0.28, 'sawtooth', 0.07); tone(392, 0.22, 'sawtooth', 0.09, 0.34); tone(494, 0.22, 'sawtooth', 0.07, 0.34); };
  const blip = () => { tone(880, 0.09, 'square', 0.06); tone(1320, 0.14, 'square', 0.05, 0.08); };
  const fanfare = () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.06, i * 0.09)); };

  /* ---------- toasts ---------- */
  function toast(icon, title, sub) {
    const el = document.createElement('div'); el.className = 'toast panel';
    el.innerHTML = '<div class="t-ico">' + icon + '</div><div><b></b><span></span></div>';
    $('b', el).textContent = title; $('span', el).textContent = sub || '';
    const box = $('#toasts'); box.appendChild(el); while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), 3700);
  }

  /* ---------- trophies ---------- */
  const TOTAL_COINS = 12;
  const TROPHIES = [
    { id: 'honk', ico: '📣', name: 'First Honk', desc: 'Press the horn in the top bar.', prog: () => [Math.min(S.honk, 1), 1] },
    { id: 'coins3', ico: '🪙', name: 'Pocket Change', desc: 'Collect 3 hidden cedi coins.', prog: () => [Math.min(S.coins.length, 3), 3] },
    { id: 'coins12', ico: '💰', name: 'Cedi Collector', desc: 'Find all ' + TOTAL_COINS + ' coins on the page.', prog: () => [S.coins.length, TOTAL_COINS] },
    { id: 'modes', ico: '🚌', name: 'Shift Planner', desc: 'Look at all four shift modes.', prog: () => [S.modes.length, 4] },
    { id: 'pins', ico: '📍', name: 'Map Reader', desc: 'Tap 5 pins on the Gold Coast City radar.', prog: () => [Math.min(S.pins.length, 5), 5] },
    { id: 'dl1', ico: '🖼️', name: 'Wallpaper Rookie', desc: 'Download your first 4K wallpaper.', prog: () => [Math.min(S.dl.length, 1), 1] },
    { id: 'dl8', ico: '🔥', name: 'Wallpaper Hoarder', desc: 'Download 8 wallpapers.', prog: () => [Math.min(S.dl.length, 8), 8] },
    { id: 'dlall', ico: '🏆', name: 'Full Garage', desc: 'Collect every wallpaper.', prog: () => [S.dl.length, (window.__SHOTS || []).length || 16] },
    { id: 'night', ico: '🎆', name: 'Night Owl', desc: 'Open a night shot.', prog: () => [S.views.some(id => (window.__SHOTS || []).find(s => s.id === id && s.tags.includes('night'))) ? 1 : 0, 1] },
    { id: 'viewer', ico: '👀', name: 'Photo Mode', desc: 'View 5 screenshots full size.', prog: () => [Math.min(S.views.length, 5), 5] }
  ];
  function renderTrophies(silent) {
    const g = $('#trophyGrid'); if (!g) return;
    g.innerHTML = '';
    TROPHIES.forEach(t => {
      const [a, b] = t.prog(), done = a >= b;
      const el = document.createElement('div'); el.className = 'trophy panel' + (done ? ' is-on' : '');
      el.innerHTML = '<div class="t-ico">' + t.ico + '</div><b></b><span></span><div class="st"></div>';
      $('b', el).textContent = t.name; $('span', el).textContent = t.desc; $('.st', el).textContent = done ? 'UNLOCKED' : a + ' / ' + b;
      g.appendChild(el);
      if (done && !S.shown.includes(t.id)) { S.shown.push(t.id); if (!silent) { toast(t.ico, 'Achievement unlocked', t.name); fanfare(); } }
    });
    save();
  }

  /* ---------- XP / level / cash ---------- */
  const LEVELS = ['NOVICE', 'DRIVER', 'CONDUCTOR', 'MATE', 'STATION MASTER', 'ROUTE KING', 'LEGEND'];
  let scrollPct = 0, lastLevel = 0;
  function xpNow() { return Math.round(scrollPct * 60 + S.coins.length * 8 + S.dl.length * 6 + S.shown.length * 12); }
  function updateHud() {
    const xp = xpNow(), per = 40, lvl = Math.floor(xp / per), into = xp - lvl * per;
    $('#lvl').textContent = 'LVL ' + (lvl + 1); $('#lvlTitle').textContent = LEVELS[Math.min(lvl, LEVELS.length - 1)];
    $('#xpNum').textContent = xp + ' XP'; $('#xpFill').style.width = (into / per * 100) + '%';
    $('#cash').textContent = 'GHS ' + (S.coins.length * 5);
    if (lastLevel && lvl > lastLevel) { toast('⬆️', 'Level up!', 'You are now level ' + (lvl + 1) + ': ' + LEVELS[Math.min(lvl, LEVELS.length - 1)]); fanfare(); }
    lastLevel = lvl;
  }

  /* ---------- scroll: progress, parallax, gauge ---------- */
  let lastY = scrollY, speed = 0, ticking = false;
  const needle = $('#gNeedle'), arc = $('#gArc'), gs = $('#gSpeed'), heroBg = $('#heroBg');
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight; scrollPct = max > 0 ? scrollY / max : 0;
    if (!reduce && heroBg && scrollY < innerHeight * 1.2) heroBg.style.transform = 'translate3d(0,' + (scrollY * 0.22) + 'px,0)';
    if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; updateHud(); }); }
  }
  function gaugeLoop() {
    const dy = Math.abs(scrollY - lastY); lastY = scrollY;
    const target = Math.min(160, dy * 3.2); speed += (target - speed) * 0.12;
    if (needle) needle.style.transform = 'rotate(' + (-135 + speed / 160 * 270) + 'deg)';
    if (arc) arc.style.strokeDasharray = (speed / 160 * 100) + ' 100';
    if (gs) gs.textContent = Math.round(speed);
    requestAnimationFrame(gaugeLoop);
  }

  /* ---------- ticker ---------- */
  const SLOGANS = ["GOD'S TIME IS BEST", 'NO CONDITION IS PERMANENT', 'TROTRO STATION', 'ONLY GOD CAN JUDGE ME', 'MIND THE POTHOLES', "DON'T DRIVE LIKE ME", 'GOLD COAST CITY', 'FARES + TIPS'];
  (function () {
    const t = $('#tickerTrack'); if (!t) return; let h = '';
    for (let r = 0; r < 4; r++) SLOGANS.forEach(s => { h += '<span>' + s + '</span><span class="dot">&#9679;</span>'; });
    t.innerHTML = h;
  })();

  /* ---------- modes ---------- */
  const MODES = [
    { name: 'Free Roam', tag: 'No rules // Just drive', blurb: 'Cruise Gold Coast City with no timer and no job. Learn the roads, find the markets, dodge the potholes. Police checkpoints still apply.', reward: 'No payout', diff: 15, pay: 5, img: '/img/modes/mode_0.webp' },
    { name: 'Route', tag: 'Pick up // Drop off // Get paid', blurb: 'Collect passengers at tro tro stops and drop them where they are going. Smooth driving keeps the comfort rating, and the tips, high.', reward: 'Fares + tips', diff: 50, pay: 65, img: '/img/modes/mode_1.webp' },
    { name: 'Carrier', tag: 'Fragile // Haul // Deliver', blurb: 'Haul goods between markets and kiosks. Every pothole, bump and crash damages the cargo, and the payout follows what arrives intact.', reward: 'Payout x cargo health', diff: 70, pay: 75, img: '/img/modes/mode_2.webp' },
    { name: 'Rush Hour', tag: 'Race the clock // Chain fares', blurb: 'Two and a half minutes on the clock. Every drop-off adds time. Chain fares as fast as you dare. The checkpoints will not wait.', reward: 'Fares + time bonus', diff: 92, pay: 90, img: '/img/modes/mode_3.webp' }
  ];
  (function () {
    const grid = $('#modeGrid'), panel = $('#modePanel'); if (!grid) return;
    MODES.forEach((m, i) => {
      const b = document.createElement('button'); b.className = 'mode panel'; b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<div class="art"></div><div class="txt"><h3></h3><div class="tag"></div></div>';
      $('.art', b).style.backgroundImage = 'url(' + m.img + ')'; $('h3', b).textContent = m.name; $('.tag', b).textContent = m.tag;
      b.addEventListener('click', () => select(i)); grid.appendChild(b);
    });
    function select(i) {
      const m = MODES[i];
      $$('.mode', grid).forEach((el, k) => { el.classList.toggle('is-on', k === i); el.setAttribute('aria-pressed', k === i); });
      panel.innerHTML = '<div><h3></h3><p></p><span class="reward"></span></div><div class="bars"><div class="bar"><label>Difficulty<span></span></label><div class="track"><i></i></div></div><div class="bar"><label>Payout potential<span></span></label><div class="track"><i></i></div></div></div>';
      $('h3', panel).textContent = m.name; $('p', panel).textContent = m.blurb; $('.reward', panel).textContent = 'Earns: ' + m.reward;
      const labs = $$('.bar', panel); const vals = [m.diff, m.pay];
      labs.forEach((bar, k) => { $('span', bar).textContent = vals[k] + '%'; requestAnimationFrame(() => requestAnimationFrame(() => { $('i', bar).style.width = vals[k] + '%'; })); });
      blip(); if (addTo('modes', i)) { save(); renderTrophies(); updateHud(); }
    }
    select(1); S.modes = S.modes.filter(x => x !== 1 || S.shown.includes('modes') || true); // selecting the default does not count unless clicked
    S.modes = (JSON.parse(localStorage.getItem(KEY) || '{}').modes) || []; save();
    panel.classList.add('in');
  })();

  /* ---------- radar map (positions come from the game's own world coordinates) ---------- */
  const PINS = [
    { n: 'Independence Square', x: 0, z: 150, k: 'landmark', d: 'Black Star Square, Independence Arch, the Kwame Nkrumah Mausoleum, Jubilee House and the National Theatre all sit within a few hundred metres.' },
    { n: 'Osu Castle', x: 1260, z: -60, k: 'landmark', d: 'The old castle walls on the coast, with the flag flying over them.' },
    { n: 'Jamestown Lighthouse', x: -2340, z: -60, k: 'landmark', d: 'The lighthouse at the western end of the coast road.' },
    { n: 'Gold Coast Sports Stadium', x: -480, z: 1020, k: 'landmark', d: 'The big bowl of the stadium, with its own surrounding streets.' },
    { n: 'Kwame Nkrumah Circle', x: -900, z: 1980, k: 'landmark', d: 'The famous interchange, with a real flyover you can drive over and under.' },
    { n: 'Kotoka International Airport', x: 2340, z: 3540, k: 'landmark', d: 'Terminal, runways and the busy roads that feed them.' },
    { n: 'Gold Coast Mall', x: 1020, z: 3300, k: 'landmark', d: 'Shopping, car parks and a lot of fares waiting to be picked up.' },
    { n: 'University of Ghana', x: 1380, z: 4740, k: 'landmark', d: 'The Balme Library and the campus roads around it.' },
    { n: 'Makola Market', x: -951, z: 664, k: 'market', d: 'Wall-to-wall stalls and umbrellas, and the busiest roads in the game.' },
    { n: 'Kaneshie Market', x: -2637, z: 1370, k: 'market', d: 'Stall rows, shop fronts and hawkers working the stopped cars.' },
    { n: 'Mallam Junction', x: -4761, z: 1077, k: 'market', d: 'A big western market junction on the way out of the city.' },
    { n: 'Labadi coast road', x: 2753, z: -122, k: 'place', d: 'The sea on one side, the town on the other, and a long golden-hour run.' },
    { n: 'Achimota Forest', x: -2638, z: 4512, k: 'place', d: 'Dirt roads through the trees on the north-western edge of the map.' },
    { n: 'East Legon', x: 3049, z: 4315, k: 'place', d: 'Wide estate roads, walls and gates in the north-east.' },
    { n: 'Greater Gold Coast villages', x: 2521, z: 1731, k: 'place', d: 'Red earth, brick houses and village roads. Many shifts start here.' }
  ];
  (function () {
    const host = $('#pins'), info = $('#pinInfo'), list = $('#lmList'); if (!host) return;
    const cx = -900, cz = 2000, hx = 4600, hz = 3500; let maxR = 0;
    PINS.forEach(p => { p.u = (p.x - cx) / hx; p.v = (p.z - cz) / hz; maxR = Math.max(maxR, Math.hypot(p.u, p.v)); });
    const sc = Math.min(1, 0.86 / maxR);
    const els = [], chips = [];
    PINS.forEach((p, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pin kind-' + p.k; b.setAttribute('aria-label', p.n); b.innerHTML = '<i></i>';
      b.style.left = (50 + p.u * sc * 46) + '%'; b.style.top = (50 - p.v * sc * 46) + '%'; host.appendChild(b); els.push(b);
      const c = document.createElement('button'); c.type = 'button'; c.className = 'lm'; c.textContent = p.n; list.appendChild(c); chips.push(c);
      const go = () => {
        els.forEach((e, k) => e.classList.toggle('is-on', k === i)); chips.forEach((e, k) => e.classList.toggle('is-on', k === i));
        $('b', info).textContent = p.n; $('span', info).textContent = p.d; blip();
        if (addTo('pins', i)) { save(); renderTrophies(); updateHud(); }
      };
      b.addEventListener('click', go); c.addEventListener('click', go);
    });
  })();

  /* ---------- gallery + lightbox ---------- */
  let SHOTS = [], view = [], cur = 0;
  const DL = id => '/downloads/troski-simulator-' + id;
  function markDownload(id) {
    if (addTo('dl', id)) { save(); updateCollection(); renderTrophies(); updateHud(); toast('⬇️', 'Wallpaper collected', (S.dl.length) + ' of ' + SHOTS.length + ' in your garage'); blip(); }
  }
  function updateCollection() {
    const n = S.dl.length, t = SHOTS.length || 16;
    $('#colTxt').textContent = n + ' / ' + t + ' collected'; $('#colFill').style.width = (n / t * 100) + '%';
    $$('.shot').forEach(el => el.classList.toggle('is-got', S.dl.includes(el.dataset.id)));
  }
  const TAGNAME = { troski: 'THE TROSKI', villages: 'VILLAGE', markets: 'MARKET', landmarks: 'LANDMARK', night: 'NIGHT' };
  function renderGallery(filter) {
    const g = $('#gallery'); g.innerHTML = '';
    view = SHOTS.filter(s => filter === 'all' || s.tags.includes(filter));
    view.forEach((s, i) => {
      const el = document.createElement('article'); el.className = 'shot panel'; el.dataset.id = s.id;
      el.innerHTML = '<button class="im" type="button" aria-label="View"><img loading="lazy" decoration="async" width="960" height="540"><span class="badge"></span><span class="got">&#10003; COLLECTED</span></button><div class="meta"><div><b></b><span></span></div><a class="dl" download aria-label="Download 4K"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg></a></div>';
      const img = $('img', el); img.src = '/gallery/thumb/' + s.id + '.webp'; img.alt = s.title + ' - ' + s.place + ', ' + s.time;
      $('.badge', el).textContent = TAGNAME[s.tags[0]] || s.tags[0].toUpperCase();
      $('b', el).textContent = s.title; $('.meta span', el).textContent = s.place + ' · ' + s.time;
      const a = $('.dl', el); a.href = DL(s.id) + '-4k.jpg'; a.setAttribute('download', 'troski-simulator-' + s.id + '-4k.jpg'); a.title = 'Download 4K (' + s.mb4k + ' MB)';
      a.addEventListener('click', () => markDownload(s.id));
      $('.im', el).addEventListener('click', () => openLb(i));
      g.appendChild(el);
    });
    updateCollection();
  }
  const lb = $('#lb');
  function openLb(i) {
    cur = (i + view.length) % view.length; const s = view[cur];
    $('#lbImg').src = '/gallery/view/' + s.id + '.webp'; $('#lbImg').alt = s.title;
    $('#lbTitle').textContent = s.title; $('#lbSub').textContent = s.place + ' · ' + s.time; $('#lbBlurb').textContent = s.blurb;
    const d4 = $('#lbDl4k'), d1 = $('#lbDl1080');
    d4.href = DL(s.id) + '-4k.jpg'; d4.setAttribute('download', 'troski-simulator-' + s.id + '-4k.jpg'); $('#lbDl4kTxt').textContent = 'DOWNLOAD 4K (' + s.mb4k + ' MB)';
    d1.href = DL(s.id) + '-1080p.jpg'; d1.setAttribute('download', 'troski-simulator-' + s.id + '-1080p.jpg'); $('#lbDl1080Txt').textContent = '1080p';
    d4.onclick = () => markDownload(s.id); d1.onclick = () => markDownload(s.id);
    lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lbClose').focus();
    if (addTo('views', s.id)) { save(); renderTrophies(); updateHud(); }
  }
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; };
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => openLb(cur - 1));
  $('#lbNext').addEventListener('click', () => openLb(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') openLb(cur - 1); else if (e.key === 'ArrowRight') openLb(cur + 1);
  });
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('.fchip'); if (!b) return;
    $$('.fchip').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); });
    renderGallery(b.dataset.f);
  });
  fetch('/gallery/shots.json').then(r => r.json()).then(d => { SHOTS = d; window.__SHOTS = d; renderGallery('all'); renderTrophies(true); updateHud(); })
    .catch(() => { $('#gallery').innerHTML = '<p class="lead">The gallery could not load. Please refresh the page.</p>'; });

  /* ---------- hidden coins ---------- */
  const COIN_SPOTS = [['hero', .93, .22], ['game', .06, .22], ['game', .94, .62], ['modes', .04, .5], ['modes', .96, .84], ['world', .5, .08], ['world', .03, .86], ['wallpapers', .95, .12], ['wallpapers', .04, .55], ['trophies', .9, .2], ['get', .12, .3], ['get', .88, .62]];
  function placeCoins() {
    const layer = $('#coinLayer'); layer.innerHTML = '';
    COIN_SPOTS.forEach(([sec, fx, fy], i) => {
      const id = 'c' + i; if (S.coins.includes(id)) return;
      const s = document.getElementById(sec); if (!s) return; const r = s.getBoundingClientRect();
      const b = document.createElement('button'); b.className = 'coin'; b.type = 'button'; b.setAttribute('aria-label', 'Collect cedi coin');
      b.style.left = (r.left + scrollX + r.width * fx - 17) + 'px'; b.style.top = (r.top + scrollY + r.height * fy - 17) + 'px'; b.style.animationDelay = (i * -0.35) + 's';
      b.addEventListener('click', () => {
        b.classList.add('pop'); setTimeout(() => b.remove(), 520);
        if (addTo('coins', id)) { save(); blip(); toast('🪙', '+GHS 5', S.coins.length + ' of ' + TOTAL_COINS + ' coins found'); renderTrophies(); updateHud(); }
      });
      layer.appendChild(b);
    });
  }
  document.body.style.position = 'relative';

  /* ---------- horn / mute ---------- */
  $('#horn').addEventListener('click', () => { honk(); S.honk++; save(); renderTrophies(); updateHud(); });
  const muteBtn = $('#muteBtn');
  function paintMute() { $('#muteTxt').textContent = S.muted ? 'SFX OFF' : 'SFX ON'; muteBtn.setAttribute('aria-pressed', S.muted); }
  muteBtn.addEventListener('click', () => { S.muted = !S.muted; save(); paintMute(); });
  paintMute();

  /* ---------- reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 }) : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---------- go ---------- */
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { placeCoins(); });
  renderTrophies(true); updateHud(); onScroll();
  if (!reduce) requestAnimationFrame(gaugeLoop);
  window.addEventListener('load', () => { placeCoins(); setTimeout(placeCoins, 1200); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeCoins);
})();

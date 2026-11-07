/* Troski Simulator site: XP bar, hidden cedi coins, achievements, mode picker, radar map, 4K gallery */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- saved progress ---------- */
  const KEY = 'troski_site_v1';
  const blank = { coins: [], dl: [], modes: [], pins: [], views: [], honk: 0, muted: false, shown: [], radioOff: false, tickets: [], seed: 0 };
  let S;
  try { S = Object.assign({}, blank, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = Object.assign({}, blank); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } };
  const addTo = (arr, v) => { if (!S[arr].includes(v)) { S[arr].push(v); return true; } return false; };

  /* ---------- sound effects: the game's own files (/sfx), decoded once and played through Web Audio ---------- */
  let ac; const buf = {}, pending = {};
  const NAMES = ['horn', 'click', 'tap', 'popup', 'play', 'whoosh', 'sting', 'cash', 'coin', 'bonus', 'door'];
  const ctx = () => { if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); } if (ac && ac.state === 'suspended') ac.resume(); return ac; };
  function load(name) {
    if (buf[name] || pending[name]) return pending[name];
    const a = ctx(); if (!a) return null;
    return (pending[name] = fetch('/sfx/' + name + '.mp3').then(r => r.arrayBuffer()).then(b => new Promise((res, rej) => a.decodeAudioData(b, res, rej))).then(d => { buf[name] = d; return d; }).catch(() => null));
  }
  function play(name, vol) {
    if (S.muted) return; const a = ctx(); if (!a) return;
    const go = () => { const d = buf[name]; if (!d) return; const src = a.createBufferSource(), g = a.createGain(); src.buffer = d; g.gain.value = vol || 0.8; src.connect(g).connect(a.destination); src.start(); };
    if (buf[name]) go(); else { const p = load(name); if (p) p.then(go); }
  }
  const warm = () => { NAMES.forEach(load); removeEventListener('pointerdown', warm); removeEventListener('keydown', warm); };
  addEventListener('pointerdown', warm); addEventListener('keydown', warm);
  const honk = () => play('horn', 0.9), blip = () => play('tap', 0.7), pickSfx = () => play('click', 0.8), fanfare = () => play('bonus', 0.7), levelUp = () => play('sting', 0.8);

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
    { id: 'viewer', ico: '👀', name: 'Photo Mode', desc: 'View 5 screenshots full size.', prog: () => [Math.min(S.views.length, 5), 5] },
    { id: 'tix1', ico: '🎫', name: 'Ticket Spotter', desc: 'Find your first golden ticket.', prog: () => [Math.min(S.tickets.length, 1), 1] },
    { id: 'tix6', ico: '🎟️', name: 'Ticket Master', desc: 'Find all 6 golden tickets.', prog: () => [S.tickets.length, 6] }
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
  function xpNow() { return Math.round(scrollPct * 60 + S.coins.length * 8 + S.dl.length * 6 + S.shown.length * 12 + S.tickets.length * 10); }
  function updateHud() {
    const xp = xpNow(), per = 40, lvl = Math.floor(xp / per), into = xp - lvl * per;
    $('#lvl').textContent = 'LVL ' + (lvl + 1); $('#lvlTitle').textContent = LEVELS[Math.min(lvl, LEVELS.length - 1)];
    $('#xpNum').textContent = xp + ' XP'; $('#xpFill').style.width = (into / per * 100) + '%';
    $('#cash').textContent = 'GHS ' + (S.coins.length * 5);
    $('#tixCount').textContent = S.tickets.length + '/6'; updateTixVisibility();
    if (lastLevel && lvl > lastLevel) { toast('⬆️', 'Level up!', 'You are now level ' + (lvl + 1) + ': ' + LEVELS[Math.min(lvl, LEVELS.length - 1)]); levelUp(); }
    lastLevel = lvl;
  }

  /* ---------- ticket hunt (experiment): per-visitor hidden tickets + a simulated crowd ---------- */
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  if (!S.seed) { S.seed = ((Math.random() * 4294967295) >>> 0) || 1; save(); }
  // every visitor gets their own seed, so the hiding places differ per person
  const HUNT = (() => {
    const r = mulberry(S.seed), side = () => (r() < .5 ? .03 + r() * .09 : .88 + r() * .09);
    const secs1 = ['game', 'modes', 'world', 'wallpapers'], secs2 = ['trophies', 'get', 'hunt', 'world'];
    const s1 = secs1[Math.floor(r() * secs1.length)], pool2 = secs2.filter(x => x !== s1), s2 = pool2[Math.floor(r() * pool2.length)];
    return { t1: { sec: s1, fx: side(), fy: .12 + r() * .76 }, t2: { sec: s2, fx: side(), fy: .12 + r() * .76 }, pinR: r(), shotR: r(), lx: 12 + r() * 70, ly: 14 + r() * 38, radioN: 2 + Math.floor(r() * 3) };
  })();
  const TIX = 6, has = n => S.tickets.includes(n);
  const CLUES = [null,
    'A golden ticket is bobbing somewhere on this page. Scroll slowly and check the edges.',
    'Ticket 2 is shy. It only shows up once you are deep into the page, and it is small.',
    'Tickets love the radar. Once you hold two, one of the pins on the map hides one. Keep tapping pins.',
    'A screenshot holds a secret. Once you hold three, open screenshots full size and watch for a flash.',
    'Make some noise. Once you hold four, give the horn three short blasts, back to back.',
    'Tune in and stay tuned. Once you hold five, it rides the radio between stations, but only for a moment.'];

  function take(n, el) {
    if (has(n)) return;
    S.tickets.push(n); save();
    if (el) { el.classList.add('pop'); setTimeout(() => el.remove(), 520); }
    toast('🎫', 'Ticket ' + n + ' found', S.tickets.length + ' of ' + TIX + ' golden tickets');
    fanfare(); renderHunt(); renderTrophies(); updateHud();
  }
  // a short-lived ticket for the later, harder finds
  function miniTicket(n, parent, css, life) {
    if (has(n) || S.tickets.length < n - 1 || !parent || parent.querySelector('.tix[data-n="' + n + '"]')) return;
    const b = document.createElement('button'); b.className = 'tix mini'; b.type = 'button'; b.dataset.n = n; b.setAttribute('aria-label', 'Collect golden ticket'); b.textContent = '★';
    Object.assign(b.style, css);
    b.addEventListener('click', e => { e.stopPropagation(); take(n, b); });
    parent.appendChild(b);
    setTimeout(() => { if (b.isConnected && !b.classList.contains('pop')) { b.classList.add('gone'); setTimeout(() => b.remove(), 320); } }, life);
  }
  // tickets 1 and 2 sit on the page itself, in a different place for each visitor
  function placeTix() {
    const layer = $('#tixLayer'); if (!layer) return; layer.innerHTML = '';
    [[1, HUNT.t1], [2, HUNT.t2]].forEach(([n, h]) => {
      if (has(n)) return;
      const s = document.getElementById(h.sec); if (!s) return; const r = s.getBoundingClientRect();
      const b = document.createElement('button'); b.className = 'tix' + (n === 2 ? ' shy' : ''); b.type = 'button'; b.dataset.n = n; b.setAttribute('aria-label', 'Collect golden ticket'); b.textContent = '★';
      const w = n === 2 ? 32 : 46;
      b.style.left = Math.max(4, Math.min(document.documentElement.clientWidth - w - 4, r.left + scrollX + r.width * h.fx - w / 2)) + 'px';
      b.style.top = (r.top + scrollY + r.height * h.fy) + 'px';
      b.addEventListener('click', () => take(n, b));
      layer.appendChild(b);
    });
    updateTixVisibility();
  }
  function updateTixVisibility() { const el = $('#tixLayer .tix.shy'); if (el) el.style.display = scrollPct > .5 ? '' : 'none'; }
  const honks = [];
  function huntHonk() {
    const t = performance.now(); honks.push(t); while (honks.length && t - honks[0] > 1800) honks.shift();
    if (honks.length >= 3) { honks.length = 0; const r = $('#horn').getBoundingClientRect(); miniTicket(5, document.body, { position: 'fixed', left: Math.max(4, r.left - 4) + 'px', top: (r.bottom + 10) + 'px' }, 3000); }
  }
  let hops = 0;
  function huntRadio() {
    hops++;
    if (hops >= HUNT.radioN && (hops === HUNT.radioN || Math.random() < .3)) { const r = $('#radio').getBoundingClientRect(); miniTicket(6, document.body, { position: 'fixed', left: Math.max(4, r.right - 150) + 'px', top: Math.max(4, r.top - 40) + 'px' }, 2200); }
  }
  function huntLightbox(s) {
    $$('.tix', lb).forEach(e => e.remove());
    if (S.tickets.length >= 3 && !has(4) && SHOTS.length && s.id === SHOTS[Math.floor(HUNT.shotR * SHOTS.length)].id) {
      setTimeout(() => { if (!lb.hidden && view[cur] === s) miniTicket(4, lb, { left: HUNT.lx + '%', top: HUNT.ly + '%' }, 3000); }, 1400);
    }
  }

  /* simulated crowd: the same for every visitor, replayed from the start of each week (Mon 00:00 UTC) */
  const DAY = 864e5, HR = 36e5, simDay = parseFloat(new URLSearchParams(location.search).get('simday'));
const W0 = Date.UTC(2026, 10, 7, 19, 30);
  const T0 = Date.now(), clock = () => (isNaN(simDay) ? Date.now() : W0 + simDay * DAY + (Date.now() - T0));
  const EVENTS = (() => {
    const r = mulberry(Math.floor(W0 / DAY) * 7919 + 13), ev = [], used = new Set();
    const F = ['Kofi', 'Ama', 'Kwame', 'Akosua', 'Yaw', 'Abena', 'Kwesi', 'Efua', 'Nana', 'Esi', 'Kojo', 'Adwoa', 'Femi', 'Sena', 'Mensah', 'Selorm'];
    const T = ['Drives', 'Mate', 'Roads', 'Gold', 'Fare', 'Pothole', 'Horn', 'Rider', 'Shift', 'Ace'];
    const nm = () => { let n; do { n = F[Math.floor(r() * F.length)] + T[Math.floor(r() * T.length)] + (10 + Math.floor(r() * 89)); } while (used.has(n)); used.add(n); return n; };
    const G = [0, 0, 3, 6, 10, 16, 24, 30];                        // average hours it takes to get from the previous ticket to ticket k
    for (let f = 0; f < 10; f++) {                                  // the ten simulated final-badge claims; the tenth lands at a random time on the last day
      const who = nm(); let t = W0 + (f < 9 ? 4.5 + r() * 1.4 : 6 + r() * .98) * DAY;
      ev.push({ who, k: 7, t });
      for (let k = 6; k >= 1; k--) { t = Math.max(t - G[k + 1] * HR * (.5 + r()), W0 + k * 6e4); ev.push({ who, k, t }); }
    }
    const P = [0, .78, .6, .5, .4, .3];                             // chance of getting past ticket k
    for (let h = 0; h < 140; h++) {
      const who = nm(); let t = W0 + Math.pow(r(), 1.6) * 6.6 * DAY;
      for (let k = 1; k <= 6; k++) { ev.push({ who, k, t }); if (k === 6 || r() > P[k]) break; t += G[k + 1] * HR * (.4 + r() * 1.2); }
    }
    return ev.sort((a, b) => a.t - b.t);
  })();
  const ago = ms => { const m = Math.max(1, Math.round(ms / 6e4)); return m < 60 ? m + 'm ago' : m < 1440 ? Math.floor(m / 60) + 'h ago' : Math.floor(m / 1440) + 'd ago'; };
  function renderBoard() {
    const box = $('#boardRows'); if (!box) return;
    const now = clock(), seen = EVENTS.filter(e => e.t <= now), c = [0, 0, 0, 0, 0, 0, 0, 0]; seen.forEach(e => c[e.k]++);
    const max = Math.max(1, c[1]); box.innerHTML = '';
    for (let n = 1; n <= 6; n++) {
      const row = document.createElement('div'); row.className = 'brow'; row.innerHTML = '<span></span><div class="track"><i></i></div><b></b>';
      $('span', row).textContent = 'Ticket ' + n; $('i', row).style.width = (c[n] / max * 100) + '%'; $('b', row).textContent = c[n]; box.appendChild(row);
    }
    $('#pips').innerHTML = Array.from({ length: 10 }, (_, i) => '<i class="' + (i < c[7] ? 'on' : '') + '"></i>').join('');
    $('#finalTxt').textContent = c[7] >= 10 ? 'All 10 final badges claimed' : c[7] + ' / 10 claimed';
    const left = W0 + 7 * DAY - now;
    $('#huntLeft').textContent = left <= 0 ? 'HUNT CLOSED' : 'ENDS IN ' + Math.floor(left / DAY) + 'D ' + String(Math.floor(left % DAY / HR)).padStart(2, '0') + 'H';
    const feed = $('#feed'); feed.innerHTML = '';
    seen.slice(-6).reverse().forEach(e => {
      const li = document.createElement('li'); li.innerHTML = '<b></b> <span></span> <time></time>';
      $('b', li).textContent = e.who; $('span', li).textContent = e.k === 7 ? 'claimed a final badge' : 'found ticket ' + e.k; $('time', li).textContent = ago(now - e.t); feed.appendChild(li);
    });
  }
  function renderHunt() {
    const row = $('#tixRow'); if (!row) return; row.innerHTML = '';
    for (let n = 1; n <= 7; n++) {
      const got = n < 7 && has(n), el = document.createElement('div');
      el.className = 'slot panel' + (got ? ' is-on' : '') + (n === 7 ? ' final' : ''); el.innerHTML = '<div class="no"></div><div class="st"></div>';
      $('.no', el).textContent = n === 7 ? '?' : n; $('.st', el).textContent = got ? 'FOUND' : n === 7 ? 'NOT PRINTED YET' : 'HIDDEN'; row.appendChild(el);
    }
    const next = [1, 2, 3, 4, 5, 6].find(n => !has(n));
    $('#clueNo').textContent = next ? 'CLUE FOR TICKET ' + next : 'TICKET MASTER';
    $('#clueTxt').textContent = next ? CLUES[next] : 'You hold all six tickets. Ticket 7 is still being printed. Check back later.';
    $('#huntYou').textContent = S.tickets.length + ' / ' + TIX;
    renderBoard();
  }
  renderHunt(); setInterval(renderBoard, 20000);

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
      pickSfx(); if (addTo('modes', i)) { save(); renderTrophies(); updateHud(); }
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
        $('b', info).textContent = p.n; $('span', info).textContent = p.d; pickSfx();
        if (i === Math.floor(HUNT.pinR * PINS.length)) miniTicket(3, host, { left: b.style.left, top: b.style.top, margin: '-38px 0 0 -21px' }, 4000);
        if (addTo('pins', i)) { save(); renderTrophies(); updateHud(); }
      };
      b.addEventListener('click', go); c.addEventListener('click', go);
    });
  })();

  /* ---------- gallery + lightbox ---------- */
  let SHOTS = [], view = [], cur = 0;
  const DL = id => '/downloads/troski-simulator-' + id;
  function markDownload(id) {
    if (addTo('dl', id)) { save(); updateCollection(); renderTrophies(); updateHud(); toast('⬇️', 'Wallpaper collected', (S.dl.length) + ' of ' + SHOTS.length + ' in your garage'); play('cash', 0.8); }
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
    const im = $('#lbImg'), full = '/gallery/view/' + s.id + '.webp'; im.alt = s.title;
    im.classList.add('loading'); im.src = '/gallery/thumb/' + s.id + '.webp';          // the new picture's thumbnail shows at once (never the previous picture)
    const pre = new Image(); pre.onload = () => { if (view[cur] === s) { im.src = full; im.classList.remove('loading'); [cur - 1, cur + 1].forEach(k => { const n = view[(k + view.length) % view.length]; if (n) new Image().src = '/gallery/view/' + n.id + '.webp'; }); } }; pre.src = full;
    $('#lbTitle').textContent = s.title; $('#lbSub').textContent = s.place + ' · ' + s.time; $('#lbBlurb').textContent = s.blurb;
    const d4 = $('#lbDl4k'), d1 = $('#lbDl1080');
    d4.href = DL(s.id) + '-4k.jpg'; d4.setAttribute('download', 'troski-simulator-' + s.id + '-4k.jpg'); $('#lbDl4kTxt').textContent = 'DOWNLOAD 4K (' + s.mb4k + ' MB)';
    d1.href = DL(s.id) + '-1080p.jpg'; d1.setAttribute('download', 'troski-simulator-' + s.id + '-1080p.jpg'); $('#lbDl1080Txt').textContent = '1080p';
    d4.onclick = () => markDownload(s.id); d1.onclick = () => markDownload(s.id);
    if (lb.hidden) play('whoosh', 0.6); lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lbClose').focus();
    if (addTo('views', s.id)) { save(); renderTrophies(); updateHud(); }
    huntLightbox(s);
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
    pickSfx(); renderGallery(b.dataset.f);
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
      b.style.left = Math.max(4, Math.min(document.documentElement.clientWidth - 40, r.left + scrollX + r.width * fx - 17)) + 'px'; b.style.top = (r.top + scrollY + r.height * fy - 17) + 'px'; b.style.animationDelay = (i * -0.35) + 's';
      b.addEventListener('click', () => {
        b.classList.add('pop'); setTimeout(() => b.remove(), 520);
        if (addTo('coins', id)) { save(); play('coin', 0.9); toast('🪙', '+GHS 5', S.coins.length + ' of ' + TOTAL_COINS + ' coins found'); renderTrophies(); updateHud(); }
      });
      layer.appendChild(b);
    });
  }
  document.body.style.position = 'relative';

  /* ---------- horn / mute ---------- */
  $('#startShift').addEventListener('click', () => play('play', 0.7));
  $('#horn').addEventListener('click', () => { honk(); huntHonk(); S.honk++; save(); renderTrophies(); updateHud(); });
  const muteBtn = $('#muteBtn');
  function paintMute() { $('#muteTxt').textContent = S.muted ? 'SFX OFF' : 'SFX ON'; muteBtn.setAttribute('aria-pressed', S.muted); }
  muteBtn.addEventListener('click', () => { S.muted = !S.muted; save(); paintMute(); });
  paintMute();

  /* ---------- reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 }) : null;
  $$('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));


  /* ---------- radio: random Ghanaian stations (same source as the game), 30 seconds each, no manual tuning ---------- */
  (function () {
    const box = $('#radio'); if (!box) return;
    const nameEl = $('#radioName'), secsEl = $('#radioSecs'), ringEl = $('#radioRing'), btn = $('#radioBtn');
    const HOSTS = ['https://de1.api.radio-browser.info', 'https://nl1.api.radio-browser.info', 'https://at1.api.radio-browser.info'];
    const BAD = /church|gospel|prayer|evangelist|parousia|amen|reach the world|fruitful|bible|jesus|christ|word|chapel|kingdom|apostolic|pentecost|oduro/i;
    const GOOD = /hitz|y\s?fm|joy|luv|happy|adom|angel|oman|asempa|nhyira|agoo|atl|kente|ghana music|afro|shatta|rainbow|cape|citi|peace|sankofa|uniiq|hana|dadi|skyy|infinity|sompa|opemsuo/i;
    const MUSIC = ['highlife', 'afrobeat', 'hiplife', 'reggae', 'dancehall', 'hip hop', 'afro', 'r&b', 'pop', 'music', 'hits'];
    const SLOT = 30; let list = [], queue = [], on = !S.radioOff, started = false, playing = false, tick = null, left = SLOT, last = '', failTimer = null, vfade = null;
    const audio = new Audio(); audio.preload = 'none'; audio.volume = 0;
    const VOL = 0.55;

    function stopStream() { audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load(); }      // closes the connection, so nothing keeps downloading
    function paint() {
      box.classList.toggle('off', !on); btn.textContent = on ? 'RADIO ON' : 'RADIO OFF'; btn.setAttribute('aria-pressed', on);
      if (!on) { nameEl.textContent = 'RADIO OFF'; secsEl.textContent = '--'; ringEl.style.strokeDashoffset = 100; }
    }
    function fade(to, ms, done) {
      clearInterval(vfade); const from = audio.volume, t0 = performance.now();
      vfade = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); audio.volume = from + (to - from) * k; if (k >= 1) { clearInterval(vfade); if (done) done(); } }, 40);
    }
    function pick() {
      if (!list.length) return null; if (!queue.length) { queue = list.slice().sort(() => Math.random() - 0.5); if (queue.length > 1 && queue[queue.length - 1].u === last) queue.unshift(queue.pop()); }
      return queue.pop();
    }
    function startClock() {
      clearInterval(tick); left = SLOT; paintClock();
      tick = setInterval(() => { left--; paintClock(); if (left <= 0) next(); }, 1000);
    }
    function paintClock() { secsEl.textContent = left; ringEl.style.strokeDashoffset = 100 - (left / SLOT) * 100; }
    function next() {
      clearInterval(failTimer); if (!on) return; const st = pick(); if (!st) { nameEl.textContent = 'NO SIGNAL'; return; }
      fade(0, 350, () => {
        if (!on) return; stopStream(); last = st.u; nameEl.textContent = st.n; audio.src = st.u; startClock(); huntRadio();
        const bad = () => { clearTimeout(failTimer); if (on && audio.dataset.cur === st.u) { stopStream(); next(); } };
        audio.dataset.cur = st.u; audio.onerror = bad; clearTimeout(failTimer); failTimer = setTimeout(() => { if (audio.paused || audio.readyState < 3) bad(); }, 8000);
        audio.play().then(() => { fade(VOL, 700); }).catch(bad);
      });
    }
    function usable(it) {
      if (!it || !it.url_resolved || !/^https:/i.test(it.url_resolved)) return false; const c = (it.codec || '').toUpperCase(); if (c !== 'MP3' && c !== 'AAC' && c !== 'AAC+') return false;
      if (BAD.test(it.name)) return false; const t = (it.tags || '').toLowerCase(); return MUSIC.some(m => t.includes(m)) || GOOD.test(it.name);
    }
    async function fetchList() {
      for (const h of HOSTS) {
        try {
          const r = await fetch(h + '/json/stations/bycountrycodeexact/GH?hidebroken=true&order=clickcount&reverse=true&limit=160'); if (!r.ok) continue; const d = await r.json(), seen = new Set(), out = [];
          d.forEach(it => { if (usable(it) && !seen.has(it.url_resolved)) { seen.add(it.url_resolved); out.push({ n: it.name.trim().replace(/Accra/gi, 'Gold Coast'), u: it.url_resolved }); } });
          if (out.length >= 5) return out;
        } catch (e) { /* next host */ }
      }
      try { return (await (await fetch('/radio-fallback.json')).json()).map(s => ({ n: s.n.replace(/Accra/gi, 'Gold Coast'), u: s.u })); } catch (e) { return []; }
    }
    async function begin() {
      if (started || !on) return; started = true; nameEl.textContent = 'TUNING...'; list = await fetchList(); if (!on) { started = false; return; } next();
    }
    function userStart() { removeEventListener('pointerdown', userStart); removeEventListener('keydown', userStart); begin(); }
    btn.addEventListener('click', e => {
      e.stopPropagation(); on = !on; S.radioOff = !on; save(); paint(); play('click', 0.7);
      if (!on) { clearInterval(tick); clearTimeout(failTimer); audio.onerror = null; fade(0, 300, stopStream); } else { if (!started) begin(); else next(); }
    });
    paint();
    if (on) { addEventListener('pointerdown', userStart); addEventListener('keydown', userStart); }
  })();

  /* ---------- go ---------- */
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { placeCoins(); placeTix(); });
  renderTrophies(true); updateHud(); onScroll();
  if (!reduce) requestAnimationFrame(gaugeLoop);
  window.addEventListener('load', () => { placeCoins(); placeTix(); setTimeout(() => { placeCoins(); placeTix(); }, 1200); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { placeCoins(); placeTix(); });
})();
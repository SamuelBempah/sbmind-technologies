import React, { useCallback, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteField, collection, query, where, orderBy, limit, getDocs,
  getCountFromServer, getAggregateFromServer, sum, Timestamp, serverTimestamp, increment,
} from 'firebase/firestore';
import { upload } from '@vercel/blob/client';
import { auth, db, googleProvider } from '../lib/firebase';

// ---------------------------------------------------------------------------------------------------------------------
// Dead Deck admin (owner only). Who is an admin is decided by the Firestore security rules: a document in admins/<uid>, which only the
// Firebase console can create. Everything below is plain Firestore reads and writes done as that signed-in admin; a non-admin who opens
// this page is refused by the rules, not by this code.
//   Overview: players, active now, ads, money, bans.   Players: find by tag, ban (temporary or permanent, with a note), unban, history.
//   Ranked: the first-to-the-top reward ($10 or a mystery box), this month's prize, pause, leaderboard, reset the ladder, edit RP.
// ---------------------------------------------------------------------------------------------------------------------

const season = () => { const n = new Date(); return `${n.getUTCFullYear()}-${n.getUTCMonth() + 1}`; };
const fmtDate = (t) => (t && t.toDate ? t.toDate().toLocaleString() : '-');
const money = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;
const FOREVER_YEARS = 100;
const TOP_RP = 900; // DEAD KING: the top tier starts here (100 RP per tier, 10 tiers)
const ORIGIN = 'https://www.sbmindtechnologies.com';

// the two kinds of ranked reward
const REWARDS = {
  cash: {
    label: '$10 cash',
    title: 'FIRST TO REACH DEAD KING WINS $10',
    text: 'Be the very first player to climb to the top rank and the $10 is yours.',
    image: `${ORIGIN}/deaddeck/reward-10.png`,
    local: '/deaddeck/reward-10.png',
  },
  mystery: {
    label: 'Mystery box',
    title: 'FIRST TO REACH DEAD KING WINS A MYSTERY BOX',
    text: 'Be the very first player to climb to the top rank and open the Dead Deck mystery box.',
    image: `${ORIGIN}/deaddeck/mystery-box.png`,
    local: '/deaddeck/mystery-box.png',
  },
};

const CSS = `
.da{position:fixed;inset:0;overflow:auto;z-index:9999;background:#050506;color:#eef0f5;font-family:"General Sans",system-ui,sans-serif}
.da *{box-sizing:border-box}
.da-bg{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(7px) saturate(1.3) brightness(.32);transform:scale(1.08)}
.da-shade{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 0%,rgba(224,20,60,.18),transparent 55%),linear-gradient(180deg,rgba(5,5,6,.35),rgba(5,5,6,.92) 70%)}
.da-scan{position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px)}
.da-wrap{position:relative;min-height:100%}
.da-top{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:22px;padding:12px 28px;background:rgba(6,6,9,.72);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08)}
.da-top img{height:40px;width:auto;display:block}
.da-nav{display:flex;gap:6px;margin:0 auto;padding:5px;border-radius:99px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.da-tab{background:none;border:0;color:#a3a9bb;padding:9px 20px;border-radius:99px;cursor:pointer;letter-spacing:.14em;font-size:12px;text-transform:uppercase;font-weight:700;transition:.2s;white-space:nowrap}
.da-tab:hover{color:#fff}
.da-tab.on{background:#e0143c;color:#fff;box-shadow:0 0 24px rgba(224,20,60,.55)}
.da-who{color:#8f95a8;font-size:13px;white-space:nowrap}
.da-who b{color:#fff;cursor:pointer;margin-left:10px;padding:6px 12px;border:1px solid rgba(255,255,255,.18);border-radius:99px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:600}
.da-who b:hover{background:rgba(255,255,255,.1)}
.da-main{max-width:1180px;margin:0 auto;padding:36px 28px 90px;animation:da-in .55s ease both}
.da-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
.da-title h1{margin:0;font-size:13px;letter-spacing:.42em;color:#e0143c;text-transform:uppercase}
.da-live{display:inline-flex;align-items:center;gap:8px;color:#74e6a0;font-size:11px;letter-spacing:.2em;text-transform:uppercase}
.da-live i{width:8px;height:8px;border-radius:50%;background:#2fe07a;animation:da-ping 1.8s infinite}
.da-panel{position:relative;background:rgba(14,15,21,.74);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:24px 26px;overflow:hidden}
.da-panel::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#e0143c,transparent)}
.da-panel h2{margin:0 0 16px;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#9aa1b6;font-weight:700}
.da-cols{display:grid;grid-template-columns:1.15fr .85fr;gap:20px;margin-top:20px;align-items:start}
.da-stack{display:flex;flex-direction:column;gap:20px}
.da-hero{display:grid;grid-template-columns:auto 1fr;gap:38px;align-items:center}
.da-big{font-size:104px;line-height:.95;font-weight:800;letter-spacing:-.02em;background:linear-gradient(180deg,#fff,#ff6b86);-webkit-background-clip:text;background-clip:text;color:transparent}
.da-bigl{font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:#9aa1b6;margin-top:10px;display:flex;align-items:center;gap:10px}
.da-bigl i{width:9px;height:9px;border-radius:50%;background:#2fe07a;animation:da-ping 1.8s infinite}
.da-mini{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.08);border-radius:12px;overflow:hidden}
.da-mini>div,.da-strip>div{background:rgba(10,11,16,.92);padding:16px 18px}
.da-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.08);border-radius:12px;overflow:hidden}
.da-mini small,.da-strip small{display:block;color:#7f869b;font-size:10px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:8px}
.da-mini b,.da-strip b{font-size:30px;font-weight:800}
.da-strip b.gold{color:#ffd45a}.da-strip b.red{color:#ff4d70}
.da-note{color:#6c7388;font-size:12px;margin:16px 0 0}
.da input,.da textarea,.da select{background:rgba(5,6,10,.8);border:1px solid rgba(255,255,255,.12);color:#fff;border-radius:10px;padding:12px 14px;font-size:15px;width:100%;margin-bottom:10px;font-family:inherit;transition:.15s}
.da input:focus,.da textarea:focus,.da select:focus{outline:none;border-color:#e0143c;box-shadow:0 0 0 3px rgba(224,20,60,.22)}
.da textarea{min-height:76px;resize:vertical}
.da-row{display:flex;gap:10px;flex-wrap:wrap}
.da-row>*{flex:1;min-width:140px}
.da-btn{position:relative;overflow:hidden;background:linear-gradient(180deg,#f01a45,#c40f35);color:#fff;border:0;border-radius:10px;padding:12px 18px;cursor:pointer;font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:12px;transition:.15s;box-shadow:0 8px 22px rgba(224,20,60,.32)}
.da-btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.1)}
.da-btn.ghost{background:rgba(255,255,255,.07);box-shadow:none;color:#d4d8e4;border:1px solid rgba(255,255,255,.14)}
.da-btn.warn{background:linear-gradient(180deg,#c47a10,#9a5a00);box-shadow:0 8px 22px rgba(196,122,16,.28)}
.da-btn.gold{background:linear-gradient(180deg,#ffd45a,#d9a21b);color:#2a1700;box-shadow:0 8px 22px rgba(255,200,60,.32)}
.da-btn:disabled{opacity:.4;cursor:default}
.da-table{width:100%;border-collapse:collapse;font-size:14px}
.da-table th{text-align:left;color:#7c8294;font-size:10px;letter-spacing:.2em;text-transform:uppercase;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.1)}
.da-table td{padding:11px 10px;border-bottom:1px solid rgba(255,255,255,.05)}
.da-table tr:hover td{background:rgba(255,255,255,.03)}
.da-pill{display:inline-block;padding:3px 10px;border-radius:99px;font-size:10px;letter-spacing:.14em;background:rgba(255,255,255,.08);color:#b6bccd;text-transform:uppercase}
.da-pill.red{background:rgba(224,20,60,.22);color:#ff8c9b}
.da-pill.green{background:rgba(47,224,122,.15);color:#74e6a0}
.da-pill.gold{background:rgba(255,212,90,.18);color:#ffd45a}
.da-msg{margin:12px 0 0;color:#74e6a0}.da-err{margin:12px 0 0;color:#ff6b7a}
.da-chip{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:99px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#d4d8e4;cursor:pointer;font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;transition:.15s}
.da-chip.on{border-color:#ffd45a;color:#ffd45a;background:rgba(255,212,90,.1);box-shadow:0 0 18px rgba(255,212,90,.25)}
.da-login{position:relative;max-width:410px;margin:12vh auto;background:rgba(14,15,21,.82);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:32px;box-shadow:0 30px 90px rgba(0,0,0,.6);animation:da-in .5s ease both}
.da-login img{width:230px;display:block;margin:0 auto 6px}
.da-reward{position:relative;display:flex;align-items:center;justify-content:center;padding:6px 0}
.da-reward::before{content:"";position:absolute;inset:8% 6%;background:radial-gradient(ellipse,rgba(255,190,60,.5),transparent 68%);filter:blur(28px);animation:da-breathe 3.2s ease-in-out infinite}
.da-reward .card{position:relative;width:100%;max-width:560px;animation:da-float 4s ease-in-out infinite}
.da-reward img{width:100%;height:auto;display:block;filter:drop-shadow(0 14px 30px rgba(0,0,0,.55))}
.da-reward .sweep{position:absolute;inset:14.3% 8.9%;border-radius:5%;overflow:hidden;pointer-events:none}
.da-reward .sweep::after{content:"";position:absolute;top:-20%;bottom:-20%;left:-35%;width:22%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-18deg);animation:da-sweep 3.4s ease-in-out infinite}
.da-reward .claimed{position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);padding:7px 18px;border-radius:99px;background:#0b0b10;border:1px solid #ffd45a;color:#ffd45a;font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:800;box-shadow:0 0 22px rgba(255,212,90,.4);white-space:nowrap}
.da-rhead{display:grid;grid-template-columns:1.05fr 1fr;gap:34px;align-items:center}
.da-rhead h3{margin:0 0 8px;font-size:28px;line-height:1.15;color:#ffe083;letter-spacing:.02em}
.da-rhead p{margin:0 0 18px;color:#b9bfd0;line-height:1.55}
@media(max-width:900px){.da-cols,.da-rhead,.da-hero{grid-template-columns:1fr}.da-big{font-size:76px}.da-nav{margin:0}.da-top{flex-wrap:wrap;padding:10px 14px}.da-main{padding:22px 14px 80px}.da-mini{grid-template-columns:repeat(2,1fr)}.da-strip{grid-template-columns:repeat(2,1fr)}}
@keyframes da-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes da-ping{0%{box-shadow:0 0 0 0 rgba(47,224,122,.6)}70%,100%{box-shadow:0 0 0 10px rgba(47,224,122,0)}}
@keyframes da-float{0%,100%{transform:translateY(0) rotate(-.6deg)}50%{transform:translateY(-8px) rotate(.6deg)}}
@keyframes da-breathe{0%,100%{opacity:.55;transform:scale(.96)}50%{opacity:1;transform:scale(1.04)}}
@keyframes da-sweep{0%,35%{left:-35%}100%{left:140%}}
`;

function useMsg() {
  const [m, setM] = useState('');
  const [e, setE] = useState('');
  return { m, e, ok: (t) => { setM(t); setE(''); }, bad: (t) => { setE(t); setM(''); } };
}

function Title({ text, live }) {
  return <div className="da-title"><h1>{text}</h1>{live && <span className="da-live"><i /> live</span>}</div>;
}

// ------------------------------------------------------------------ overview
function Overview() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try {
      const users = collection(db, 'users');
      const now = Date.now();
      const ts = (ms) => Timestamp.fromMillis(now - ms);
      const count = async (q) => (await getCountFromServer(q)).data().count;
      const [total, active5, active24, active7, banned, newToday, ranked] = await Promise.all([
        count(users),
        count(query(users, where('lastSeen', '>', ts(5 * 60e3)))),
        count(query(users, where('lastSeen', '>', ts(24 * 3600e3)))),
        count(query(users, where('lastSeen', '>', ts(7 * 24 * 3600e3)))),
        count(query(users, where('banUntil', '>', Timestamp.now()))),
        count(query(users, where('createdAt', '>', ts(24 * 3600e3)))),
        count(collection(db, 'ranked', season(), 'players')),
      ]);
      const agg = await getAggregateFromServer(users, { ads: sum('adsPlayed'), plays: sum('plays'), spent: sum('spentCents') });
      setS({ total, active5, active24, active7, banned, newToday, ranked, ...agg.data() });
      setErr('');
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  return (
    <>
      <Title text="Overview" live />
      {err && <p className="da-err">{err}</p>}
      {!s && !err && <p>Loading...</p>}
      {s && (
        <>
          <div className="da-panel">
            <div className="da-hero">
              <div>
                <div className="da-big">{s.active5}</div>
                <div className="da-bigl"><i /> playing right now</div>
              </div>
              <div className="da-mini">
                <div><small>Total players</small><b>{s.total}</b></div>
                <div><small>Active today</small><b>{s.active24}</b></div>
                <div><small>This week</small><b>{s.active7}</b></div>
                <div><small>New today</small><b>{s.newToday}</b></div>
                <div><small>Ranked this month</small><b>{s.ranked}</b></div>
                <div><small>Banned</small><b>{s.banned}</b></div>
              </div>
            </div>
          </div>
          <div className="da-panel" style={{ marginTop: 20 }}>
            <h2>The game</h2>
            <div className="da-strip">
              <div><small>Matches played</small><b>{s.plays || 0}</b></div>
              <div><small>Ads played</small><b>{s.ads || 0}</b></div>
              <div><small>Money spent</small><b className="gold">{money(s.spent)}</b></div>
              <div><small>Season</small><b className="red">{season()}</b></div>
            </div>
            <p className="da-note">Numbers update while players are online (the game reports about every two minutes). This page refreshes itself every minute.</p>
          </div>
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ players and bans
function Players({ admin }) {
  const [tag, setTag] = useState('');
  const [p, setP] = useState(null); // { uid, data }
  const [recent, setRecent] = useState([]);
  const [days, setDays] = useState('7');
  const [perm, setPerm] = useState(false);
  const [note, setNote] = useState('');
  const [log, setLog] = useState([]);
  const msg = useMsg();

  const loadRecent = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('lastSeen', 'desc'), limit(15)));
      setRecent(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    } catch (e) { msg.bad(e.message); }
  }, []); // eslint-disable-line
  useEffect(() => { loadRecent(); }, [loadRecent]);

  const open = async (uid) => {
    const d = await getDoc(doc(db, 'users', uid));
    if (!d.exists()) { msg.bad('No such player.'); return; }
    setP({ uid, data: d.data() });
    setNote(''); msg.ok('');
    // filtered by player only and sorted here, so no composite index is needed
    const l = await getDocs(query(collection(db, 'banLog'), where('uid', '==', uid))).catch(() => ({ docs: [] }));
    setLog(l.docs.map((x) => x.data()).sort((a, b) => (b.at?.toMillis() || 0) - (a.at?.toMillis() || 0)).slice(0, 20));
  };
  const find = async () => {
    try {
      const t = await getDoc(doc(db, 'tags', tag.trim().toLowerCase()));
      if (!t.exists()) { msg.bad('No player with that tag.'); return; }
      await open(t.data().uid);
    } catch (e) { msg.bad(e.message); }
  };
  const banned = p && p.data.banUntil && p.data.banUntil.toMillis() > Date.now();

  const ban = async () => {
    try {
      const until = perm ? Timestamp.fromMillis(Date.now() + FOREVER_YEARS * 365 * 86400e3) : Timestamp.fromMillis(Date.now() + Number(days) * 86400e3);
      await updateDoc(doc(db, 'users', p.uid), { banUntil: until, banNote: note.trim(), banBy: admin.uid, banAt: serverTimestamp() });
      await addDoc(collection(db, 'banLog'), { uid: p.uid, tag: p.data.tag, action: perm ? 'permanent ban' : `ban ${days} days`, note: note.trim(), by: admin.uid, at: serverTimestamp() });
      msg.ok(perm ? 'Permanently banned.' : `Banned for ${days} days.`);
      await open(p.uid);
    } catch (e) { msg.bad(e.message); }
  };
  const unban = async () => {
    try {
      await updateDoc(doc(db, 'users', p.uid), { banUntil: deleteField(), banNote: deleteField() });
      await addDoc(collection(db, 'banLog'), { uid: p.uid, tag: p.data.tag, action: 'unban', note: note.trim(), by: admin.uid, at: serverTimestamp() });
      msg.ok('Ban lifted.');
      await open(p.uid);
    } catch (e) { msg.bad(e.message); }
  };

  return (
    <>
      <Title text="Players & bans" />
      <div className="da-cols">
        <div className="da-stack">
          <div className="da-panel">
            <h2>Find a player</h2>
            <div className="da-row">
              <input placeholder="Dead Deck tag" value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && find()} />
              <button className="da-btn" style={{ flex: '0 0 auto' }} onClick={find}>Find</button>
            </div>
            {msg.m && <div className="da-msg">{msg.m}</div>}{msg.e && <div className="da-err">{msg.e}</div>}
          </div>

          {p && (
            <div className="da-panel">
              <h2>Player</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <b style={{ fontSize: 34 }}>{p.data.tag}</b>
                {banned ? <span className="da-pill red">banned until {p.data.banUntil.toMillis() > Date.now() + 50 * 365 * 86400e3 ? 'forever' : fmtDate(p.data.banUntil)}</span> : <span className="da-pill green">good standing</span>}
              </div>
              <table className="da-table">
                <tbody>
                  <tr><td>Joined</td><td>{fmtDate(p.data.createdAt)}</td></tr>
                  <tr><td>Last seen</td><td>{fmtDate(p.data.lastSeen)}</td></tr>
                  <tr><td>Version / platform</td><td>{p.data.version || '-'} / {p.data.platform || '-'}</td></tr>
                  <tr><td>Matches / ads / spent</td><td>{p.data.plays || 0} / {p.data.adsPlayed || 0} / {money(p.data.spentCents)}</td></tr>
                  <tr><td>Tag last changed</td><td>{fmtDate(p.data.tagChangedAt)}</td></tr>
                  {banned && <tr><td>Ban note</td><td>{p.data.banNote || '-'}</td></tr>}
                  <tr><td>Player id</td><td style={{ fontSize: 12, color: '#6b7080' }}>{p.uid}</td></tr>
                </tbody>
              </table>
              <h2 style={{ marginTop: 22 }}>{banned ? 'Change or lift the ban' : 'Ban this player'}</h2>
              <select value={perm ? 'perm' : days} onChange={(e) => { if (e.target.value === 'perm') setPerm(true); else { setPerm(false); setDays(e.target.value); } }}>
                <option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option>
                <option value="30">30 days</option><option value="90">90 days</option><option value="perm">Permanent</option>
              </select>
              <textarea placeholder="Note (the player sees this when they try to sign in): why they were banned" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="da-row">
                <button className="da-btn warn" onClick={ban} disabled={!note.trim()}>{banned ? 'Replace ban' : perm ? 'Ban forever' : 'Ban'}</button>
                {banned && <button className="da-btn ghost" onClick={unban}>Lift ban</button>}
              </div>
              {log.length > 0 && (
                <>
                  <h2 style={{ marginTop: 22 }}>History</h2>
                  <table className="da-table"><tbody>{log.map((l, i) => <tr key={i}><td>{fmtDate(l.at)}</td><td>{l.action}</td><td>{l.note}</td></tr>)}</tbody></table>
                </>
              )}
            </div>
          )}
        </div>

        <div className="da-panel">
          <h2>Recently active</h2>
          <table className="da-table">
            <thead><tr><th>Tag</th><th>Last seen</th><th /></tr></thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.uid}>
                  <td><b>{r.tag}</b><div style={{ fontSize: 11, color: '#6c7388' }}>{r.version || '-'} / {r.platform || '-'}</div></td>
                  <td style={{ fontSize: 12 }}>{fmtDate(r.lastSeen)}</td>
                  <td><button className="da-btn ghost" style={{ padding: '8px 12px' }} onClick={() => open(r.uid)}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ the reward card: the real card art with the shimmer over it
function RewardCard({ image, winner }) {
  return (
    <div className="da-reward">
      <div className="card">
        {image ? <img alt="" src={image} /> : <div style={{ aspectRatio: '900/560' }} />}
        <div className="sweep" />
        {winner && <div className="claimed">Claimed by {winner}</div>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ ranked
function Ranked() {
  const [cfg, setCfg] = useState({
    seasonName: '', prizeText: '', prizeImage: '', rankedEnabled: true, rankedEpoch: 0,
    topRewardKind: 'cash', topRewardTitle: REWARDS.cash.title, topRewardText: REWARDS.cash.text, topRewardImage: REWARDS.cash.image, topWinner: '',
  });
  const [board, setBoard] = useState([]);
  const [top, setTop] = useState([]);
  const [edit, setEdit] = useState(false);
  const msg = useMsg();

  const load = useCallback(async () => {
    try {
      const c = await getDoc(doc(db, 'config', 'live'));
      if (c.exists()) setCfg((o) => ({ ...o, ...c.data() }));
      const b = await getDocs(query(collection(db, 'ranked', season(), 'players'), orderBy('rp', 'desc'), limit(50)));
      const rows = b.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setBoard(rows);
      // who reached the top rank, earliest first (the first to get there wins the reward)
      setTop(rows.filter((r) => (r.best || r.rp) >= TOP_RP).sort((x, y) => (x.updatedAt?.toMillis() || 0) - (y.updatedAt?.toMillis() || 0)));
    } catch (e) { msg.bad(e.message); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const pickKind = (k) => setCfg({ ...cfg, topRewardKind: k, topRewardTitle: REWARDS[k].title, topRewardText: REWARDS[k].text, topRewardImage: REWARDS[k].image });
  const previewImage = (REWARDS[cfg.topRewardKind] && REWARDS[cfg.topRewardKind].image === cfg.topRewardImage) ? REWARDS[cfg.topRewardKind].local : cfg.topRewardImage;

  const save = async () => {
    try {
      await setDoc(doc(db, 'config', 'live'), {
        seasonName: cfg.seasonName || '', prizeText: cfg.prizeText || '', prizeImage: cfg.prizeImage || '', rankedEnabled: !!cfg.rankedEnabled,
        topRewardKind: cfg.topRewardKind || 'cash', topRewardTitle: cfg.topRewardTitle || '', topRewardText: cfg.topRewardText || '',
        topRewardImage: cfg.topRewardImage || '', topWinner: cfg.topWinner || '',
      }, { merge: true });
      msg.ok('Saved. Players see it the next time they open Ranked.');
    } catch (e) { msg.bad(e.message); }
  };
  const resetLadder = async () => {
    if (!window.confirm('Reset EVERY player to the bottom rank for this season? This cannot be undone.')) return;
    try {
      await setDoc(doc(db, 'config', 'live'), { rankedEpoch: increment(1) }, { merge: true });
      msg.ok('Ladder reset. Each player drops to ROOKIE the next time they open the game.');
      await load();
    } catch (e) { msg.bad(e.message); }
  };
  const setRp = async (uid, rp) => {
    try { await updateDoc(doc(db, 'ranked', season(), 'players', uid), { rp: Math.max(0, Number(rp) || 0) }); msg.ok('RP updated.'); await load(); } catch (e) { msg.bad(e.message); }
  };
  const crown = async (tag) => {
    try { await setDoc(doc(db, 'config', 'live'), { topWinner: tag }, { merge: true }); setCfg({ ...cfg, topWinner: tag }); msg.ok(`${tag} is marked as the winner. The game now shows it as claimed.`); } catch (e) { msg.bad(e.message); }
  };

  return (
    <>
      <Title text={`Ranked & prizes  -  ${season()}`} live />

      <div className="da-panel">
        <div className="da-rhead">
          <RewardCard image={previewImage} winner={cfg.topWinner} />
          <div>
            <h2>First player to the top rank</h2>
            <h3>{cfg.topRewardTitle}</h3>
            <p>{cfg.topRewardText}</p>
            <div className="da-row" style={{ marginBottom: 12 }}>
              {Object.entries(REWARDS).map(([k, r]) => (
                <span key={k} className={'da-chip' + (cfg.topRewardKind === k ? ' on' : '')} style={{ flex: '0 0 auto', minWidth: 0 }} onClick={() => { pickKind(k); setEdit(true); }}>{r.label}</span>
              ))}
            </div>
            <div className="da-row">
              <button className="da-btn gold" onClick={save}>Save reward</button>
              <button className="da-btn ghost" onClick={() => setEdit(!edit)}>{edit ? 'Hide details' : 'Edit details'}</button>
            </div>
            {edit && (
              <div style={{ marginTop: 14 }}>
                <input placeholder="Title" value={cfg.topRewardTitle || ''} onChange={(e) => setCfg({ ...cfg, topRewardTitle: e.target.value })} />
                <textarea placeholder="Text" value={cfg.topRewardText || ''} onChange={(e) => setCfg({ ...cfg, topRewardText: e.target.value })} />
                <input placeholder="Image link" value={cfg.topRewardImage || ''} onChange={(e) => setCfg({ ...cfg, topRewardImage: e.target.value })} />
                <input placeholder="Winner's tag (once someone has won)" value={cfg.topWinner || ''} onChange={(e) => setCfg({ ...cfg, topWinner: e.target.value })} />
              </div>
            )}
            {msg.m && <div className="da-msg">{msg.m}</div>}{msg.e && <div className="da-err">{msg.e}</div>}
          </div>
        </div>
      </div>

      <div className="da-cols">
        <div className="da-panel">
          <h2>Leaderboard</h2>
          <table className="da-table">
            <thead><tr><th>#</th><th>Tag</th><th>RP</th><th>Matches</th><th /></tr></thead>
            <tbody>
              {board.length === 0 && <tr><td colSpan={5} style={{ color: '#7c8294' }}>No one has played ranked this month yet.</td></tr>}
              {board.map((r, i) => (
                <tr key={r.uid}>
                  <td>{i + 1}</td><td><b>{r.tag}</b></td><td>{r.rp}</td><td>{r.played}</td>
                  <td><button className="da-btn ghost" style={{ padding: '7px 11px' }} onClick={() => { const v = window.prompt('Set RP for ' + r.tag, String(r.rp)); if (v !== null) setRp(r.uid, v); }}>Set RP</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="da-stack">
          <div className="da-panel">
            <h2>Reached the top rank</h2>
            {top.length === 0 ? <p style={{ margin: 0, color: '#7c8294' }}>Nobody has reached DEAD KING ({TOP_RP} RP) yet.</p> : (
              <table className="da-table"><tbody>{top.map((r, i) => (
                <tr key={r.uid}><td>{i === 0 ? <span className="da-pill gold">first</span> : i + 1}</td><td><b>{r.tag}</b></td>
                  <td><button className="da-btn gold" style={{ padding: '7px 11px' }} onClick={() => crown(r.tag)}>Winner</button></td></tr>
              ))}</tbody></table>
            )}
          </div>

          <div className="da-panel">
            <h2>This month's prize</h2>
            <input placeholder="Prize name" value={cfg.seasonName || ''} onChange={(e) => setCfg({ ...cfg, seasonName: e.target.value })} />
            <textarea placeholder="What the winner of the month gets" value={cfg.prizeText || ''} onChange={(e) => setCfg({ ...cfg, prizeText: e.target.value })} />
            <input placeholder="Prize image link (https://...)" value={cfg.prizeImage || ''} onChange={(e) => setCfg({ ...cfg, prizeImage: e.target.value })} />
            <div className="da-row" style={{ marginBottom: 12 }}>
              <span className="da-chip" style={{ flex: '0 0 auto', minWidth: 0 }} onClick={() => setCfg({ ...cfg, prizeImage: REWARDS.cash.image })}>$10 card</span>
              <span className="da-chip" style={{ flex: '0 0 auto', minWidth: 0 }} onClick={() => setCfg({ ...cfg, prizeImage: REWARDS.mystery.image })}>Mystery box card</span>
            </div>
            <label style={{ display: 'block', marginBottom: 14, color: '#cfd3df' }}>
              <input type="checkbox" style={{ width: 'auto', marginRight: 8 }} checked={!!cfg.rankedEnabled} onChange={(e) => setCfg({ ...cfg, rankedEnabled: e.target.checked })} />
              Ranked is open
            </label>
            <div className="da-row">
              <button className="da-btn" onClick={save}>Save</button>
              <button className="da-btn warn" onClick={resetLadder}>Reset ladder</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


// ------------------------------------------------------------------ billboards (the screens inside the games)
// Every billboard in a match shows these, one after another. They must be EXACTLY the sizes below so they fit the screens without
// stretching: the page checks the file before it uploads it.
const BB = { w: 1280, h: 720, imageMB: 2, videoMB: 15, videoSec: 20 };
const UPLOAD_URL = 'https://deaddeck-ping.vercel.app/api/upload';

const readImage = (file) => new Promise((ok, bad) => {
  const u = URL.createObjectURL(file); const i = new Image();
  i.onload = () => { const r = { w: i.naturalWidth, h: i.naturalHeight }; URL.revokeObjectURL(u); ok(r); };
  i.onerror = () => { URL.revokeObjectURL(u); bad(new Error('Could not read this image.')); };
  i.src = u;
});
const readVideo = (file) => new Promise((ok, bad) => {
  const u = URL.createObjectURL(file); const v = document.createElement('video'); v.preload = 'metadata';
  v.onloadedmetadata = () => { const r = { w: v.videoWidth, h: v.videoHeight, d: v.duration }; URL.revokeObjectURL(u); ok(r); };
  v.onerror = () => { URL.revokeObjectURL(u); bad(new Error('Could not read this video (use an MP4 with H.264).')); };
  v.src = u;
});

// returns '' when the file is fine, otherwise the exact reason
async function checkBillboardFile(file) {
  const isVideo = file.type === 'video/mp4';
  const isImage = file.type === 'image/png' || file.type === 'image/jpeg';
  if (!isVideo && !isImage) return `This file is ${file.type || 'an unknown type'}. Use a PNG or JPG image, or an MP4 video.`;
  const mb = file.size / 1048576;
  if (isImage) {
    if (mb > BB.imageMB) return `This image is ${mb.toFixed(1)} MB. Images must be ${BB.imageMB} MB or smaller.`;
    const { w, h } = await readImage(file);
    if (w !== BB.w || h !== BB.h) return `This image is ${w}×${h}. Billboards need exactly ${BB.w}×${BB.h} (16:9).`;
  } else {
    if (mb > BB.videoMB) return `This video is ${mb.toFixed(1)} MB. Videos must be ${BB.videoMB} MB or smaller.`;
    const { w, h, d } = await readVideo(file);
    if (w !== BB.w || h !== BB.h) return `This video is ${w}×${h}. Billboards need exactly ${BB.w}×${BB.h} (16:9).`;
    if (d > BB.videoSec + 0.5) return `This video is ${Math.round(d)} seconds. Videos must be ${BB.videoSec} seconds or shorter (it loops).`;
  }
  return '';
}

function Billboards() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState('');
  const [busy, setBusy] = useState(false);
  const msg = useMsg();

  const load = useCallback(async () => {
    try {
      const c = await getDoc(doc(db, 'config', 'live'));
      setItems(c.exists() && Array.isArray(c.data().billboards) ? c.data().billboards : []);
    } catch (e) { msg.bad(e.message); }
  }, []); // eslint-disable-line
  useEffect(() => { load(); }, [load]);

  const pick = async (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(null); setFileErr(''); msg.ok('');
    if (!f) return;
    try {
      const why = await checkBillboardFile(f);
      if (why) setFileErr(why); else setFile(f);
    } catch (er) { setFileErr(er.message); }
  };

  const save = async (next) => {
    await setDoc(doc(db, 'config', 'live'), { billboards: next }, { merge: true });
    setItems(next);
  };

  const add = async () => {
    if (!file) return;
    setBusy(true); msg.ok('');
    try {
      const blob = await upload('billboards/' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_'), file, {
        access: 'public', handleUploadUrl: UPLOAD_URL, clientPayload: await auth.currentUser.getIdToken(), contentType: file.type,
      });
      await save([...items, { kind: file.type === 'video/mp4' ? 'video' : 'image', url: blob.url, title: title.trim(), link: link.trim(), on: true }]);
      msg.ok('Uploaded. It is on the billboards now (players see it the next time they open a game).');
      setFile(null); setTitle(''); setLink(''); document.getElementById('bb-file').value = '';
    } catch (e) { msg.bad(e.message || 'Upload failed.'); }
    setBusy(false);
  };

  const toggle = (i) => save(items.map((x, k) => (k === i ? { ...x, on: !x.on } : x))).catch((e) => msg.bad(e.message));
  const remove = (i) => { if (window.confirm('Remove this billboard?')) save(items.filter((_, k) => k !== i)).catch((e) => msg.bad(e.message)); };
  const move = (i, d) => { const n = [...items]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; save(n).catch((e) => msg.bad(e.message)); };

  return (
    <>
      <Title text="Billboards" live />
      <div className="da-cols">
        <div className="da-stack">
          <div className="da-panel">
            <h2>Upload to the billboards</h2>
            <div className="da-card-note" style={{ color: '#b9bfd0', fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
              <b style={{ color: '#ffd45a' }}>Exact size: {BB.w} × {BB.h} pixels (16:9)</b> for both pictures and videos.<br />
              Pictures: PNG or JPG, up to {BB.imageMB} MB.<br />
              Videos: MP4 (H.264), up to {BB.videoMB} MB and {BB.videoSec} seconds, no sound needed. They loop.<br />
              Anything that is not exactly {BB.w}×{BB.h} is refused, so it always fits the screens.
            </div>
            <input id="bb-file" type="file" accept="image/png,image/jpeg,video/mp4" onChange={pick} />
            {fileErr && <div className="da-err">{fileErr}</div>}
            {file && <div className="da-msg">Good: {file.name} is the right size.</div>}
            <input placeholder="Title (only for you, e.g. Ranked reward)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input placeholder="Link (optional, opens when a player taps the billboard in the menu)" value={link} onChange={(e) => setLink(e.target.value)} />
            <button className="da-btn gold" disabled={!file || busy} onClick={add}>{busy ? 'Uploading...' : 'Upload'}</button>
            {msg.m && <div className="da-msg">{msg.m}</div>}{msg.e && <div className="da-err">{msg.e}</div>}
          </div>
        </div>
        <div className="da-panel">
          <h2>On the billboards now ({items.filter((x) => x.on).length} of {items.length})</h2>
          {items.length === 0 && <p style={{ color: '#7c8294', margin: 0 }}>Nothing uploaded yet. The billboards show Dead Deck's own promos until you add something.</p>}
          {items.map((x, i) => (
            <div key={x.url} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)', opacity: x.on ? 1 : 0.45 }}>
              {x.kind === 'video'
                ? <video src={x.url} style={{ width: 128, height: 72, borderRadius: 6, background: '#000' }} muted loop autoPlay playsInline />
                : <img alt="" src={x.url} style={{ width: 128, height: 72, borderRadius: 6, objectFit: 'cover' }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{x.title || (x.kind === 'video' ? 'Video' : 'Picture')}</b>
                <div style={{ fontSize: 12, color: '#7c8294', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.kind} {x.link ? ' / ' + x.link : ''}</div>
              </div>
              <button className="da-btn ghost" style={{ padding: '7px 10px' }} onClick={() => move(i, -1)}>↑</button>
              <button className="da-btn ghost" style={{ padding: '7px 10px' }} onClick={() => move(i, 1)}>↓</button>
              <button className="da-btn ghost" style={{ padding: '7px 10px' }} onClick={() => toggle(i)}>{x.on ? 'Hide' : 'Show'}</button>
              <button className="da-btn ghost" style={{ padding: '7px 10px' }} onClick={() => remove(i)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ the page
const TABS = [['overview', 'Overview'], ['players', 'Players & bans'], ['ranked', 'Ranked & prizes'], ['billboards', 'Billboards']];

export default function DeadDeckAdmin() {
  const [user, setUser] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(null);
  const [tab, setTab] = useState('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { document.title = 'Dead Deck Admin'; }, []);
  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u); setIsAdmin(null);
    if (!u) return;
    try { const a = await getDoc(doc(db, 'admins', u.uid)); setIsAdmin(a.exists()); } catch { setIsAdmin(false); }
  }), []);

  const login = (fn) => async () => { setErr(''); try { await fn(); } catch (e) { setErr(e.message); } };

  return (
    <div className="da">
      <style>{CSS}</style>
      <video className="da-bg" src="/deaddeck/loop.mp4" poster="/deaddeck/poster.jpg" autoPlay muted loop playsInline />
      <div className="da-shade" />
      <div className="da-scan" />
      <div className="da-wrap">
        {user === undefined && <p style={{ padding: 30 }}>Loading...</p>}
        {user === null && (
          <div className="da-login">
            <img src="/deaddeck/logo.png" alt="Dead Deck" />
            <p style={{ textAlign: 'center', letterSpacing: '.45em', color: '#e0143c', fontSize: 12, margin: '0 0 24px' }}>ADMIN</p>
            <button className="da-btn" style={{ width: '100%', marginBottom: 12 }} onClick={login(() => signInWithPopup(auth, googleProvider))}>Continue with Google</button>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="da-btn ghost" style={{ width: '100%' }} onClick={login(() => signInWithEmailAndPassword(auth, email.trim(), password))}>Sign in</button>
            {err && <div className="da-err">{err}</div>}
          </div>
        )}
        {user && isAdmin === null && <p style={{ padding: 30 }}>Checking access...</p>}
        {user && isAdmin === false && (
          <div className="da-login">
            <p>This account is not an admin.</p>
            <button className="da-btn ghost" onClick={() => signOut(auth)}>Sign out</button>
          </div>
        )}
        {user && isAdmin && (
          <>
            <header className="da-top">
              <img src="/deaddeck/logo.png" alt="Dead Deck" />
              <nav className="da-nav">
                {TABS.map(([k, l]) => <button key={k} className={'da-tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>)}
              </nav>
              <span className="da-who">{user.displayName || user.email}<b onClick={() => signOut(auth)}>Sign out</b></span>
            </header>
            <div className="da-main" key={tab}>
              {tab === 'overview' && <Overview />}
              {tab === 'players' && <Players admin={user} />}
              {tab === 'ranked' && <Ranked />}
              {tab === 'billboards' && <Billboards />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

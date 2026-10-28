import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

// ---------------------------------------------------------------------------------------------------------------------
// Dead Deck sign-in (this page is opened by the game when a player taps multiplayer).
//   1. Sign in with Google, or create / use an email account.
//   2. Pick the Dead Deck tag (3-16 letters, numbers or _). It is claimed before the sign-in finishes.
//   3. If the game opened this page it passed ?code=<random>: the sign-in is handed to the game through Firestore
//      (deviceLinks/<code>), and the player is told to go back to the game.
// Tags are unique and can be changed once every 30 days: both rules live in the Firestore security rules.
// The page is full screen on purpose (the site's top bar and cookie card are hidden on /deaddeck/*).
// ---------------------------------------------------------------------------------------------------------------------

const keyOf = (t) => t.trim().toLowerCase();
const validKey = (k) => /^[a-z0-9_]{3,16}$/.test(k);

const SUITS = ['♠', '♥', '♦', '♣'];
const drift = Array.from({ length: 16 }, (_, i) => ({
  ch: SUITS[i % 4],
  left: (i * 37 + 7) % 100,
  size: 18 + ((i * 13) % 30),
  dur: 14 + ((i * 7) % 12),
  delay: -((i * 5) % 20),
  red: i % 4 === 1 || i % 4 === 2,
}));

const CSS = `
.dd-root{position:fixed;inset:0;z-index:9999;overflow:auto;background:#050506;color:#f3f3f5;font-family:"General Sans",system-ui,sans-serif}
.dd-video{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;filter:saturate(1.25) contrast(1.1) brightness(.75);transition:opacity 1.6s ease;animation:dd-push 30s ease-in-out infinite alternate}
.dd-video.on{opacity:.55}
.dd-shade{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(5,5,6,.15) 0%,rgba(5,5,6,.72) 62%,#050506 100%),linear-gradient(180deg,rgba(5,5,6,.25),transparent 25%,transparent 70%,rgba(5,5,6,.8))}
.dd-scan{position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px);mix-blend-mode:overlay;animation:dd-roll 8s linear infinite}
.dd-suit{position:fixed;bottom:-60px;pointer-events:none;opacity:0;animation:dd-rise linear infinite;color:#fff;text-shadow:0 0 18px currentColor}
.dd-suit.red{color:#e0143c}
.dd-wrap{position:relative;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px}
.dd-logo{width:min(560px,86vw);height:auto;animation:dd-logo-in 1.3s cubic-bezier(.2,.8,.2,1) both,dd-flicker 7s 2s infinite;margin:0 0 6px;filter:drop-shadow(0 0 26px rgba(224,20,60,.4))}
.dd-tag{letter-spacing:.42em;text-transform:uppercase;font-size:12px;color:#c9ccd6;opacity:.85;margin-bottom:22px;animation:dd-fade 1.4s .6s both}
.dd-card{position:relative;width:min(440px,100%);padding:26px 24px 22px;border-radius:6px;background:linear-gradient(160deg,rgba(18,18,22,.82),rgba(8,8,10,.9));border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(14px);box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 0 1px rgba(224,20,60,.08);animation:dd-card-in .9s .5s cubic-bezier(.2,.8,.2,1) both}
.dd-card::before,.dd-card::after{content:"";position:absolute;width:22px;height:22px;border:2px solid #e0143c;pointer-events:none}
.dd-card::before{top:-1px;left:-1px;border-right:0;border-bottom:0}
.dd-card::after{bottom:-1px;right:-1px;border-left:0;border-top:0}
.dd-card h2{margin:0 0 14px;font-size:13px;letter-spacing:.3em;text-transform:uppercase;color:#e0143c;font-weight:700}
.dd-card p{color:#aab0bf;font-size:15px;line-height:1.5;margin:6px 0 14px}
.dd-in{width:100%;padding:13px 14px;border-radius:4px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.55);color:#fff;font-size:16px;outline:none;margin-bottom:10px;transition:border-color .2s,box-shadow .2s}
.dd-in:focus{border-color:#e0143c;box-shadow:0 0 0 3px rgba(224,20,60,.22)}
.dd-btn{position:relative;overflow:hidden;width:100%;padding:13px 14px;border-radius:4px;border:0;cursor:pointer;font-size:15px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;transition:transform .15s,filter .2s}
.dd-btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.12)}
.dd-btn:disabled{opacity:.45;cursor:default}
.dd-btn.red{background:#e0143c;color:#fff}
.dd-btn.red::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:dd-sheen 3.2s 1.6s infinite}
.dd-btn.white{background:#f4f4f6;color:#0b0b0d;display:flex;align-items:center;justify-content:center;gap:10px}
.dd-or{display:flex;align-items:center;gap:12px;color:#777d8c;font-size:12px;letter-spacing:.25em;text-transform:uppercase;margin:6px 0 14px}
.dd-or::before,.dd-or::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.14)}
.dd-link{text-align:center;color:#8d93a3;cursor:pointer;font-size:14px;margin:4px 0 0}
.dd-link:hover{color:#fff}
.dd-err{color:#ff5d73;margin-top:10px;font-size:14px}
.dd-ok{color:#5fe08a;margin-top:10px;font-size:14px}
.dd-big{font-size:26px;font-weight:800;letter-spacing:.04em;margin:2px 0 6px;text-align:center}
.dd-big b{color:#e0143c}
.dd-hint{min-height:20px;margin:-4px 0 10px;font-size:13px}
.dd-check{width:64px;height:64px;margin:6px auto 10px;display:block}
.dd-check circle{stroke:#5fe08a;stroke-width:3;fill:none;stroke-dasharray:190;stroke-dashoffset:190;animation:dd-draw .7s ease forwards}
.dd-check path{stroke:#5fe08a;stroke-width:4;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:50;stroke-dashoffset:50;animation:dd-draw .5s .55s ease forwards}
.dd-spin{width:34px;height:34px;margin:14px auto;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#e0143c;animation:dd-rot .8s linear infinite}
.dd-foot{margin-top:22px;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#6b7080;animation:dd-fade 1.4s 1.2s both}
@keyframes dd-logo-in{0%{opacity:0;transform:scale(1.25);filter:blur(14px)}60%{opacity:1}100%{transform:scale(1);filter:blur(0) drop-shadow(0 0 28px rgba(224,20,60,.35))}}
@keyframes dd-flicker{0%,93%,100%{opacity:1;transform:none}94%{opacity:.6;transform:translateX(-3px)}95%{opacity:1;transform:translateX(4px) skewX(-3deg)}96%{opacity:.75;transform:none}}
@keyframes dd-card-in{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
@keyframes dd-fade{from{opacity:0}to{opacity:.85}}
@keyframes dd-rise{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:.22}90%{opacity:.12}100%{transform:translateY(-115vh) rotate(200deg);opacity:0}}
@keyframes dd-roll{from{background-position:0 0}to{background-position:0 60px}}
@keyframes dd-push{from{transform:scale(1.04)}to{transform:scale(1.16)}}
@keyframes dd-sheen{0%{left:-60%}35%,100%{left:140%}}
@keyframes dd-draw{to{stroke-dashoffset:0}}
@keyframes dd-rot{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.dd-root *{animation-duration:.01s!important;animation-iteration-count:1!important}}
`;

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
    <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

// Chrome on Android starts an installed app from a link that names its package; the game's main screen opens.
const GAME_INTENT = 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.sbmindtechnologies.deaddeck;end';
const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');

export default function DeadDeckLogin() {
  const [params] = useSearchParams();
  const code = (params.get('code') || '').trim();
  const codeOk = /^[A-Za-z0-9_-]{32,128}$/.test(code);

  const [user, setUser] = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(null); // users/<uid>
  const [mode, setMode] = useState('signin'); // signin | create
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tag, setTag] = useState('');
  const [tagState, setTagState] = useState(''); // '', checking, free, taken, bad
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [linked, setLinked] = useState(false);
  const [vid, setVid] = useState(false);
  useEffect(() => { document.title = 'Dead Deck | Sign in'; }, []);

  // who is signed in, and do they already have a tag?
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setProfile(null);
      if (!u) return;
      try {
        const snap = await getDoc(doc(db, 'users', u.uid));
        setProfile(snap.exists() ? snap.data() : false);
      } catch (e) {
        setError('Could not read your profile: ' + e.message);
      }
    });
  }, []);

  // hand the finished sign-in to the game (once there is a signed-in user with a tag and the game gave us a code)
  useEffect(() => {
    if (!user || !profile || !codeOk || linked) return;
    (async () => {
      try {
        const idToken = await user.getIdToken(true);
        await setDoc(doc(db, 'deviceLinks', code), {
          uid: user.uid,
          tag: profile.tag,
          idToken,
          refreshToken: user.refreshToken,
          at: serverTimestamp(),
        });
        setLinked(true);
      } catch (e) {
        setError('Could not link to the game: ' + e.message);
      }
    })();
  }, [user, profile, codeOk, code, linked]);

  // the sign-in is handed over: open the game by itself (it checks the link as soon as it comes to the front)
  useEffect(() => {
    if (!linked || !isAndroid) return undefined;
    const t = setTimeout(() => { window.location.href = GAME_INTENT; }, 1200);
    return () => clearTimeout(t);
  }, [linked]);

  // check the tag while it is typed
  useEffect(() => {
    const k = keyOf(tag);
    if (!tag) { setTagState(''); return; }
    if (!validKey(k)) { setTagState('bad'); return; }
    setTagState('checking');
    const t = setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, 'tags', k));
        setTagState(snap.exists() ? 'taken' : 'free');
      } catch {
        setTagState('');
      }
    }, 350);
    return () => clearTimeout(t);
  }, [tag]);

  const run = async (fn) => {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); } catch (e) { setError(friendly(e)); }
    setBusy(false);
  };

  const google = () => run(() => signInWithPopup(auth, googleProvider));
  const emailGo = () => run(async () => {
    if (mode === 'create') await createUserWithEmailAndPassword(auth, email.trim(), password);
    else await signInWithEmailAndPassword(auth, email.trim(), password);
  });
  const reset = () => run(async () => {
    if (!email.trim()) throw new Error('Type your email first.');
    await sendPasswordResetEmail(auth, email.trim());
    setNotice('Password reset email sent.');
  });

  const claim = () => run(async () => {
    const k = keyOf(tag);
    if (!validKey(k)) throw new Error('Use 3 to 16 letters, numbers or underscores.');
    const batch = writeBatch(db);
    batch.set(doc(db, 'tags', k), { uid: user.uid });
    batch.set(doc(db, 'users', user.uid), {
      tag: tag.trim(), tagKey: k, tagChangedAt: serverTimestamp(), createdAt: serverTimestamp(),
    });
    await batch.commit();
    setProfile({ tag: tag.trim(), tagKey: k });
  });

  const wrap = (children, title) => (
    <div className="dd-root">
      <style>{CSS}</style>
      <video
        className={'dd-video' + (vid ? ' on' : '')}
        src="/deaddeck/loop.mp4"
        poster="/deaddeck/poster.jpg"
        autoPlay muted loop playsInline preload="auto"
        onCanPlay={() => setVid(true)}
      />
      <div className="dd-shade" />
      <div className="dd-scan" />
      {drift.map((d, i) => (
        <span
          key={i}
          className={'dd-suit' + (d.red ? ' red' : '')}
          style={{ left: d.left + '%', fontSize: d.size, animationDuration: d.dur + 's', animationDelay: d.delay + 's' }}
        >{d.ch}</span>
      ))}
      <div className="dd-wrap">
        <img className="dd-logo" src="/deaddeck/logo.png" alt="Dead Deck" />
        <div className="dd-tag">{codeOk ? 'Sign in to play multiplayer' : 'Dead Deck account'}</div>
        <div className="dd-card">
          {title && <h2>{title}</h2>}
          {children}
          {error && <div className="dd-err">{error}</div>}
          {notice && <div className="dd-ok">{notice}</div>}
        </div>
        <div className="dd-foot">The cards are dealt</div>
      </div>
    </div>
  );

  if (user === undefined) return wrap(<div className="dd-spin" />);

  // 1. not signed in
  if (!user) {
    return wrap(
      <>
        <button className="dd-btn white" disabled={busy} onClick={google}><GoogleG /> Continue with Google</button>
        <div className="dd-or">or</div>
        <input className="dd-in" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="dd-in" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="dd-btn red" disabled={busy || !email || password.length < 6} onClick={emailGo}>
          {mode === 'create' ? 'Create account' : 'Sign in'}
        </button>
        <p className="dd-link" onClick={() => setMode(mode === 'create' ? 'signin' : 'create')}>
          {mode === 'create' ? 'I already have an account' : 'New here? Create an account'}
        </p>
        {mode === 'signin' && <p className="dd-link" onClick={reset}>Forgot your password?</p>}
      </>,
      mode === 'create' ? 'Join the table' : 'Take your seat'
    );
  }

  // 2. signed in, no tag yet
  if (profile === null) return wrap(<div className="dd-spin" />);
  if (profile === false) {
    const hint = { bad: '3 to 16 letters, numbers or _', taken: 'That tag is taken', free: 'Available', checking: 'Checking…', '': '' }[tagState];
    const color = tagState === 'free' ? '#5fe08a' : tagState === 'checking' ? '#9aa3b5' : '#ff5d73';
    return wrap(
      <>
        <p>Choose your Dead Deck tag. It is how other players see you. You can change it once every 30 days.</p>
        <input className="dd-in" placeholder="Your tag" maxLength={16} value={tag} onChange={(e) => setTag(e.target.value)} />
        <div className="dd-hint" style={{ color }}>{hint}</div>
        <button className="dd-btn red" disabled={busy || tagState !== 'free'} onClick={claim}>Claim this tag</button>
        <p className="dd-link" onClick={() => signOut(auth)}>Use a different account</p>
      </>,
      'Name your player'
    );
  }

  // 3. signed in with a tag
  return wrap(
    <>
      {codeOk && linked && (
        <svg className="dd-check" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" /><path d="M18 33l9 9 19-20" /></svg>
      )}
      <div className="dd-big">You are <b>{profile.tag}</b></div>
      {codeOk ? (
        linked ? (
          isAndroid ? (
            <>
              <p style={{ textAlign: 'center' }}>All set. Opening Dead Deck...</p>
              <a className="dd-btn red" href={GAME_INTENT} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>Open Dead Deck</a>
            </>
          ) : (
            <p style={{ textAlign: 'center' }}>All set. Go back to the game: it will sign you in by itself.</p>
          )
        ) : (
          <div className="dd-spin" />
        )
      ) : (
        <p style={{ textAlign: 'center' }}>Your account is ready. Open Dead Deck and tap multiplayer.</p>
      )}
      <p className="dd-link" onClick={() => signOut(auth)}>Sign out</p>
    </>,
    codeOk && linked ? 'Linked' : undefined
  );
}

function friendly(e) {
  const c = e && e.code ? e.code : '';
  if (c === 'auth/email-already-in-use') return 'That email already has an account. Sign in instead.';
  if (c === 'auth/invalid-credential' || c === 'auth/wrong-password' || c === 'auth/user-not-found') return 'Wrong email or password.';
  if (c === 'auth/weak-password') return 'Use at least 6 characters for the password.';
  if (c === 'auth/popup-closed-by-user') return 'The Google window was closed.';
  if (c === 'auth/unauthorized-domain') return 'This site is not allowed to sign in yet (the domain must be added in Firebase).';
  if (c === 'permission-denied' || c === 'firestore/permission-denied') return 'That tag could not be claimed (it may have just been taken).';
  return (e && e.message) || 'Something went wrong.';
}

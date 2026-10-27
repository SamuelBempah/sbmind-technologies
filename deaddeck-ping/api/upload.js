// Dead Deck billboard uploads. Only a signed-in Dead Deck ADMIN may upload: the admin page sends its Firebase ID token, this function
// checks it against Firebase (the same admins/<uid> document the database rules use), then hands the browser a short-lived upload token
// for Vercel Blob. The file goes straight from the browser to Blob storage; nothing else can be uploaded.
const FIREBASE_API_KEY = 'AIzaSyAy141Xk42LAiVVS76JB2j9b-sYGAw8w9o'; // public web key of the dead-deck project
const PROJECT = 'dead-deck';
const ORIGINS = ['https://www.sbmindtechnologies.com', 'https://sbmindtechnologies.com', 'http://localhost:5173'];

async function assertAdmin(idToken) {
  if (!idToken || typeof idToken !== 'string') throw new Error('Not signed in.');
  const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!lookup.ok) throw new Error('Sign-in not accepted.');
  const uid = ((await lookup.json()).users || [])[0]?.localId;
  if (!uid) throw new Error('Unknown user.');
  const admin = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/admins/${uid}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!admin.ok) throw new Error('Not an admin.');
  return uid;
}

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!ORIGINS.includes(origin)) return res.status(403).json({ error: 'Origin not allowed' });
  try {
    const { handleUpload } = await import('@vercel/blob/client');
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await assertAdmin(clientPayload);
        if (!pathname.startsWith('billboards/')) throw new Error('Wrong folder.');
        return {
          allowedContentTypes: ['image/png', 'image/jpeg', 'video/mp4'],
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Dead Deck ping server: answers instantly so the game can time the round trip to this region.
// The region is set in vercel.json ("regions"); one project per region.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ ok: true, region: process.env.VERCEL_REGION || 'unknown' });
};

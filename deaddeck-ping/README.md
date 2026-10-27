# Dead Deck ping server

A tiny Vercel function the game times to measure how far a player is from a region (used for matchmaking by ping).

- Vercel project: import this repo, set **Root Directory** to `deaddeck-ping`, framework **Other**.
- Region: `vercel.json` -> `regions` (cpt1 = Cape Town). For another region, make another project from the same folder and change the region.
- Test: `GET /ping` returns `{"ok":true,"region":"cpt1"}`.

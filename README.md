
# Media Downloader API

Express API, no cookies needed. Deploy on Vercel as-is.

## Endpoints
- `GET /api/alldownloader?q=MEDIA_URL` — YouTube, TikTok, Instagram, Facebook, X, Threads, Pinterest, CapCut, Google Drive, MediaFire, Spotify, SoundCloud, Douyin and more (auto-detect + all-in-one fallback)
- `GET /api/search?q=QUERY` — YouTube search
- `GET /api/health`

## Run
```
npm install
npm start
```

## Keep-alive (Render / Railway)
Free Render sleeps after 15 min idle. The server pings its own `/api/health`
every 10 minutes so it never sleeps. It turns on automatically on Render
(`RENDER_EXTERNAL_URL`) and Railway (`RAILWAY_PUBLIC_DOMAIN`). Anywhere else,
set an env var:

```
KEEP_ALIVE_URL=https://your-app.onrender.com
```

Vercel is serverless, so keep-alive does not run there (and is not needed).

Extra safety (optional): add a free external pinger like cron-job.org or
UptimeRobot hitting `https://your-app.onrender.com/api/health` every 10 min.
This also wakes the server if it ever restarts ✨

# ᴘ σ ᴡ є ʀ є ᴅ ʙ ʏ ꜱ ɪ ꜰ ᴀ ᴛ

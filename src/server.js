// media downloader API (no cookies needed). Author: SIFAT
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const yts = require("yt-search");
const btch = require("btch-downloader");

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(morgan("tiny"));
app.use("/api", rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));


const RULES = [
  [/youtu\.?be/, "youtube"],
  [/tiktok\.com/, "ttdl"],
  [/instagram\.com/, "igdl"],
  [/facebook\.com|fb\.watch/, "fbdown"],
  [/twitter\.com|x\.com/, "twitter"],
  [/threads\.(net|com)/, "threads"],
  [/pinterest\.|pin\.it/, "pinterest"],
  [/capcut\.com/, "capcut"],
  [/drive\.google\.com/, "gdrive"],
  [/mediafire\.com/, "mediafire"],
  [/spotify\.com/, "spotify"],
  [/soundcloud\.com/, "soundcloud"],
  [/douyin\.com/, "douyin"],
  [/xiaohongshu\.com|xhslink\.com/, "xiaohongshu"],
  [/snackvideo\.com/, "snackvideo"],
  [/kuaishou\.com/, "kuaishou"],
  [/cocofun/, "cocofun"],
];

function cleanUrl(raw) {
  let url = String(raw || "").trim();
  if (!url) throw new Error("Missing 'q' (or 'url') parameter.");
  if (url.length > 1000 || /\s/.test(url)) throw new Error("Invalid url.");
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const u = new URL(url);
  if (!u.hostname.includes(".")) throw new Error("Invalid url.");
  return u.toString();
}

function pick(url) {
  const host = new URL(url).hostname.toLowerCase();
  const hit = RULES.find(([re]) => re.test(host));
  return hit ? hit[1] : "aio";
}

function ok(res) {
  return res && res.status !== false && !res.error;
}

async function download(url) {
  const primary = pick(url);
  const tries = primary === "aio" ? ["aio"] : [primary, "aio"];
  let last;
  for (const name of tries) {
    try {
      const data = await btch[name](url);
      if (ok(data)) return { source: name, data };
      last = data;
    } catch (e) {
      last = { error: e.message };
    }
  }
  const err = new Error("Could not fetch this link. It may be private or unsupported.");
  err.detail = last;
  throw err;
}

const handler = async (req, res) => {
  let url;
  try { url = cleanUrl(req.query.q || req.query.url); }
  catch (e) { return res.status(400).json({ status: false, error: e.message }); }
  try {
    const { source, data } = await download(url);
    res.json({ status: true, author: "SIFAT", source, url, result: data });
  } catch (e) {
    res.status(502).json({ status: false, error: e.message, detail: e.detail });
  }
};

app.get("/api/alldownloader", handler);
app.get("/api/download", handler);

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ status: false, error: "Missing 'q' parameter." });
  try {
    const r = await yts(q);
    const videos = r.videos.slice(0, 20).map((v) => ({
      title: v.title, url: v.url, videoId: v.videoId, duration: v.timestamp,
      views: v.views, ago: v.ago, thumbnail: v.thumbnail, author: v.author?.name,
    }));
    res.json({ status: true, query: q, count: videos.length, videos });
  } catch (e) {
    res.status(500).json({ status: false, error: e.message });
  }
});

app.get("/", (_req, res) => res.json({ name: "VDL Linklet API", endpoints: ["/api/alldownloader?q=URL", "/api/search?q=QUERY", "/api/health"] }));
app.get("/api/health", (_req, res) => res.json({ status: true, uptime: process.uptime() }));
app.use("/api", (_req, res) => res.status(404).json({ status: false, error: "Not found" }));

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`VDL Linklet running on http://localhost:${port}`));

  // Keep-alive: ping own /api/health every 10 min so Render/Railway never sleep.
  // Set KEEP_ALIVE_URL to your public URL, e.g. https://vdl-linklet.onrender.com
  // (Render sets RENDER_EXTERNAL_URL automatically, Railway sets RAILWAY_PUBLIC_DOMAIN.)
  const base =
    process.env.KEEP_ALIVE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  if (base) {
    cron.schedule("*/10 * * * *", () => {
      fetch(`${base.replace(/\/$/, "")}/api/health`)
        .then(() => console.log(`[keep-alive] pinged ${base}`))
        .catch((e) => console.warn(`[keep-alive] ping failed: ${e.message}`));
    });
    console.log(`[keep-alive] enabled for ${base}`);
  } else {
    console.log("[keep-alive] disabled (set KEEP_ALIVE_URL to enable)");
  }
}
module.exports = app;

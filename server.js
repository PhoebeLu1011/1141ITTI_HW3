import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use(cors());
app.use(express.json());

let kkboxKeys = { id: null, secret: null };
let tokenCache = { accessToken: null, expiresAt: 0 };

// 前端提交憑證
app.post("/api/save-kkbox-keys", (req, res) => {
  const { clientId, clientSecret } = req.body || {};
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: "缺少 KKBOX 憑證" });
  }
  kkboxKeys = { id: clientId, secret: clientSecret };
  tokenCache = { accessToken: null, expiresAt: 0 };
  res.json({ ok: true });
});

// 取得/刷新 token
async function ensureToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }
  if (!kkboxKeys.id || !kkboxKeys.secret) {
    throw new Error("伺服器尚未收到 KKBOX 憑證");
  }
  const basic = Buffer.from(`${kkboxKeys.id}:${kkboxKeys.secret}`).toString("base64");
  const r = await fetch("https://account.kkbox.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(`${r.status} ${r.statusText}: ${JSON.stringify(data)}`);
  }
  tokenCache.accessToken = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in - 30) * 1000; // 提前 30s 失效
  return tokenCache.accessToken;
}

// （可選）讓前端檢查目前 token 狀態
app.get("/api/token", async (_req, res) => {
  try {
    const t = await ensureToken();
    res.json({ access_token: t, expires_at: tokenCache.expiresAt });
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

// 代理播放清單
app.get("/kkbox/playlist/:id", async (req, res) => {
  try {
    const token = await ensureToken();
    const id = req.params.id;
    const territory = req.query.territory || "TW";
    const url = `https://api.kkbox.com/v1.1/featured-playlists/${id}?territory=${territory}`;

    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "playlist proxy failed", detail: String(e) });
  }
});

// ---- 靜態檔案：把 Vite build 出來的 dist 當前端 ----
app.use(express.static(path.join(__dirname, "dist")));

// 前端路由（React Router 等）- 交給 index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ---- 啟動 server ----
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ KKBOX proxy running on port ${PORT}`));

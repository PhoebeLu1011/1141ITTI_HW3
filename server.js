// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 取得 KKBOX access_token（用 client credentials）
app.post("/kkbox/token", async (req, res) => {
  try {
    // 前端以 header 帶來 base64(id:secret)
    const basic = req.header("x-basic-auth");
    if (!basic) return res.status(400).json({ error: "missing x-basic-auth" });

    const r = await fetch("https://account.kkbox.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "token proxy failed", detail: String(e) });
  }
});

// 轉發播放清單（避免前端再被 CORS 擋）
app.get("/kkbox/playlist/:id", async (req, res) => {
  try {
    const token = req.header("x-kkbox-token");
    const territory = req.query.territory || "TW";
    const id = req.params.id;
    if (!token) return res.status(400).json({ error: "missing x-kkbox-token" });

    const url = `https://api.kkbox.com/v1.1/featured-playlists/${id}?territory=${territory}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "playlist proxy failed", detail: String(e) });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Proxy running at http://localhost:${PORT}`));

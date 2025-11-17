import { useEffect, useState } from "react";
import "./music.css";

export default function Music() {
  const [playlist, setPlaylist] = useState(null);
  const [status, setStatus] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [clientId, setClientId] = useState(localStorage.getItem("KKBOX_CLIENT_ID") || "");
  const [clientSecret, setClientSecret] = useState(localStorage.getItem("KKBOX_CLIENT_SECRET") || "");

  const PLAYLIST_ID = "-lP7qjXsI1RZ-Iutny";
  const TERRITORY = "TW";

  // 送憑證到後端 + 存 localStorage
  const saveKeys = async () => {
    const id = clientId.trim();
    const secret = clientSecret.trim();
    if (!id || !secret) {
      setStatus("請輸入 Client ID 與 Client Secret");
      return;
    }
    localStorage.setItem("KKBOX_CLIENT_ID", id);
    localStorage.setItem("KKBOX_CLIENT_SECRET", secret);
    try {
      const r = await fetch("/api/save-kkbox-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id, clientSecret: secret }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `儲存憑證失敗（${r.status}）`);
      }
      setPanelOpen(false);
      setStatus("憑證已儲存，正在載入播放清單…");
      await loadPlaylist(); // 存完就載清單
    } catch (e) {
      console.error(e);
      setStatus(`上傳憑證失敗：${String(e.message || e)}`);
    }
  };

  // 從後端代理載入播放清單（後端會用快取 token 代打 KKBOX）
  const loadPlaylist = async () => {
    setStatus("載入播放清單中…");
    try {
      const res = await fetch(`/kkbox/playlist/${PLAYLIST_ID}?territory=${TERRITORY}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error || err?.message || `載入播放清單失敗（${res.status}）`;
        setStatus(msg.includes("憑證") ? `伺服器尚未設定 KKBOX 憑證，請點 ⚙️ 設定。` : msg);
        setPlaylist(null);
        return;
      }
      const data = await res.json();
      setPlaylist(data);
      setStatus("");
    } catch (e) {
      console.error(e);
      setStatus("載入播放清單發生錯誤，請稍後再試");
    }
  };

  useEffect(() => {
    // 一進來就嘗試載清單；若後端沒憑證，狀態會提示去設定
    loadPlaylist();
  }, []);

  return (
    <>
      {/* ⚙️ 設定按鈕（開面板用） */}
      <button
        className="kkx-gear"
        aria-label="開啟 KKBOX 設定"
        onClick={() => setPanelOpen(true)}
      >
        ⚙️
      </button>

      {/* 設定面板（輸入 Client ID / Secret） */}
      {panelOpen && (
        <div className="kkx-admin" role="dialog" aria-modal="true">
          <div className="kkx-admin-card">
            <div className="kkx-admin-header">
              <h3 id="kkx-admin-title">KKBOX 設定</h3>
              <button
                className="kkx-close"
                aria-label="關閉"
                onClick={() => setPanelOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="kkx-admin-body">
              <label className="kkx-field">
                <span>Client ID</span>
                <input
                  type="password"
                  placeholder="輸入 KKBOX Client ID"
                  autoComplete="off"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </label>
              <label className="kkx-field">
                <span>Client Secret</span>
                <input
                  type="password"
                  placeholder="輸入 KKBOX Client Secret"
                  autoComplete="off"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </label>
              <div className="kkx-actions">
                <button className="kkx-btn primary" onClick={saveKeys}>
                  取得 Token 並儲存
                </button>
                <button
                  className="kkx-btn"
                  onClick={() => {
                    localStorage.removeItem("KKBOX_CLIENT_ID");
                    localStorage.removeItem("KKBOX_CLIENT_SECRET");
                    setClientId("");
                    setClientSecret("");
                    setStatus("已清除本機憑證（後端端的憑證記憶需重設或覆蓋）");
                  }}
                >
                  清除本機憑證
                </button>
              </div>
              <p className="kkx-status" aria-live="polite">{status}</p>
            </div>
          </div>
        </div>
      )}

      {/* 播放清單畫面 */}
      {playlist ? (
        <div className="kkx-carousel">
          <h3 className="kkx-title">{playlist.title}</h3>
          <div className="kkx-strip">
            {playlist.tracks?.data?.map((song) => (
              <div key={song.id} className="kkx-song">
                <img src={song.album?.images?.[0]?.url} alt={song.name} />
                <p>{song.name}</p>
                <small>{song.album?.artist?.name}</small>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ textAlign: "center", paddingTop: "1em" }}>
          {status || "載入中…"}
        </p>
      )}
    </>
  );
}

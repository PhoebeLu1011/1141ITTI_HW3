import { useEffect, useState } from "react";
import "./music.css";

export default function Music() {
  // === UI / 資料狀態 ===
  const [hasToken, setHasToken] = useState(false);
  const [playlist, setPlaylist] = useState(null);
  const [status, setStatus] = useState("");

  // === localStorage keys / 常數 ===
  const LS_ID = "KKBOX_CLIENT_ID";
  const LS_SECRET = "KKBOX_CLIENT_SECRET";
  const LS_TOKEN = "KKBOX_TOKEN";
  const LS_EXP = "KKBOX_TOKEN_EXP";
  const PLAYLIST_ID = "-lP7qjXsI1RZ-Iutny"; // 你的播放清單 ID
  const TERRITORY = "TW";

  // 取得（或刷新）access token
  const fetchToken = async () => {
    const clientId = localStorage.getItem(LS_ID);
    const clientSecret = localStorage.getItem(LS_SECRET);
    if (!clientId || !clientSecret) {
      setStatus("尚未設定 Client ID / Secret");
      return null;
    }

    try {
      const basicAuth = btoa(`${clientId}:${clientSecret}`);

      // 直接打 KKBOX Oauth2
      const res = await fetch("https://account.kkbox.com/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (!res.ok) {
        setStatus("無法取得 Token（可能是 CORS 或憑證錯誤）");
        return null;
      }

      const data = await res.json();
      localStorage.setItem(LS_TOKEN, data.access_token);
      localStorage.setItem(LS_EXP, String(Date.now() + data.expires_in * 1000));
      return data.access_token;
    } catch (err) {
      console.error(err);
      setStatus("取得 Token 發生錯誤（可能為 CORS）");
      return null;
    }
  };

  // 載入播放清單內容
  const loadPlaylist = async () => {
    setStatus("載入播放清單中…");
    let token = localStorage.getItem(LS_TOKEN);
    const exp = parseInt(localStorage.getItem(LS_EXP) || "0", 10);

    // token 不在或過期就重新取
    if (!token || Date.now() > exp) {
      token = await fetchToken();
    }
    if (!token) return;

    try {
      const res = await fetch(
        `https://api.kkbox.com/v1.1/featured-playlists/${PLAYLIST_ID}?territory=${TERRITORY}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        setStatus("載入播放清單失敗");
        setPlaylist(null);
        setHasToken(false);
        return;
      }

      const data = await res.json();
      setPlaylist(data);
      setHasToken(true);
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("載入播放清單發生錯誤");
    }
  };

  // 初始掛載：若已有 token，自動載入播放清單；綁定設定面板事件
  useEffect(() => {
    if (localStorage.getItem(LS_TOKEN)) {
      loadPlaylist();
    }

    const gearBtn = document.getElementById("kkx-gear");
    const adminPanel = document.getElementById("kkx-admin");
    const closeBtn = document.getElementById("kkx-close");
    const idInput = document.getElementById("kkx-client-id");
    const secretInput = document.getElementById("kkx-client-secret");
    const getTokenBtn = document.getElementById("kkx-get-token");
    const clearBtn = document.getElementById("kkx-clear");
    const statusEl = document.getElementById("kkx-status");

    const setInlineStatus = (msg) => {
      if (statusEl) statusEl.textContent = msg || "";
    };

    const openPanel = () => {
      if (idInput) idInput.value = localStorage.getItem(LS_ID) || "";
      if (secretInput) secretInput.value = localStorage.getItem(LS_SECRET) || "";
      adminPanel?.classList.remove("hidden");
      setInlineStatus("");
    };
    const closePanel = () => adminPanel?.classList.add("hidden");
    const toggleByHotkey = (e) => {
      if (e.altKey && e.key.toLowerCase() === "k") {
        adminPanel?.classList.toggle("hidden");
      }
    };

    const handleSave = async () => {
      const idVal = (idInput?.value || "").trim();
      const secretVal = (secretInput?.value || "").trim();
      if (!idVal || !secretVal) {
        setInlineStatus("請輸入 Client ID 與 Secret");
        return;
      }
      localStorage.setItem(LS_ID, idVal);
      localStorage.setItem(LS_SECRET, secretVal);
      closePanel();
      await loadPlaylist(); // 存完立刻載入清單
    };

    const handleClear = () => {
      localStorage.removeItem(LS_ID);
      localStorage.removeItem(LS_SECRET);
      localStorage.removeItem(LS_TOKEN);
      localStorage.removeItem(LS_EXP);
      if (idInput) idInput.value = "";
      if (secretInput) secretInput.value = "";
      setPlaylist(null);
      setHasToken(false);
      setStatus("已清除本機憑證");
      alert("已清除本機憑證");
    };

    gearBtn?.addEventListener("click", openPanel);
    closeBtn?.addEventListener("click", closePanel);
    document.addEventListener("keydown", toggleByHotkey);
    getTokenBtn?.addEventListener("click", handleSave);
    clearBtn?.addEventListener("click", handleClear);

    return () => {
      gearBtn?.removeEventListener("click", openPanel);
      closeBtn?.removeEventListener("click", closePanel);
      document.removeEventListener("keydown", toggleByHotkey);
      getTokenBtn?.removeEventListener("click", handleSave);
      clearBtn?.removeEventListener("click", handleClear);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在首次掛載時綁事件

  return (
    <>
      {/* ⚙️ 設定按鈕 */}
      <button id="kkx-gear" className="kkx-gear" aria-label="開啟 KKBOX 設定">⚙️</button>

      {/* 設定面板 */}
      <div id="kkx-admin" className="kkx-admin hidden" role="dialog" aria-modal="true">
        <div className="kkx-admin-card">
          <div className="kkx-admin-header">
            <h3 id="kkx-admin-title">KKBOX 私密設定</h3>
            <button id="kkx-close" className="kkx-close" aria-label="關閉">✕</button>
          </div>
          <div className="kkx-admin-body">
            <label className="kkx-field">
              <span>Client ID</span>
              <input id="kkx-client-id" type="password" placeholder="輸入 KKBOX Client ID" autoComplete="off" />
            </label>
            <label className="kkx-field">
              <span>Client Secret</span>
              <input id="kkx-client-secret" type="password" placeholder="輸入 KKBOX Client Secret" autoComplete="off" />
            </label>
            <div className="kkx-actions">
              <button id="kkx-get-token" className="kkx-btn primary">取得 Token 並儲存</button>
              <button id="kkx-clear" className="kkx-btn">清除憑證</button>
            </div>
            <p id="kkx-status" className="kkx-status" aria-live="polite"></p>
          </div>
        </div>
      </div>

      {/* 播放清單 */}
      {hasToken && playlist ? (
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
          {status || "⚠️ 尚未登入 KKBOX"}
        </p>
      )}
    </>
  );
}

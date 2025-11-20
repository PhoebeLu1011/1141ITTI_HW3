import { useEffect, useState } from "react";
import "./music.css";

export default function Music() {
  const [playlist, setPlaylist] = useState(null);
  const [status, setStatus] = useState("");

  const PLAYLIST_ID = "-lP7qjXsI1RZ-Iutny";
  const TERRITORY = "TW";

  // 從後端代理載入播放清單（後端會用快取 token 代打 KKBOX）
  const loadPlaylist = async () => {
    setStatus("載入播放清單中…");
    try {
      const res = await fetch(`/kkbox/playlist/${PLAYLIST_ID}?territory=${TERRITORY}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.error ||
          err?.message ||
          `載入播放清單失敗（${res.status}）`;
        setStatus(msg);
        setPlaylist(null);
        return;
      }
      const data = await res.json();
      setPlaylist(data);
      setStatus("");
    } catch (e) {
      console.error(e);
      setStatus("載入播放清單發生錯誤，請稍後再試");
      setPlaylist(null);
    }
  };

  useEffect(() => {
    // 一進來就嘗試載清單
    loadPlaylist();
  }, []);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <button
          className="kkx-btn"
          type="button"
          onClick={loadPlaylist}
        >
          重新載入播放清單
        </button>
      </div>

      {/* 播放清單畫面 */}
      {playlist ? (
        <div className="kkx-carousel">
          <h3 className="kkx-title">{playlist.title}</h3>
          <div className="kkx-strip">
            {playlist.tracks?.data?.map((song) => (
              <div key={song.id} className="kkx-song">
                <img
                  src={song.album?.images?.[0]?.url}
                  alt={song.name}
                />
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

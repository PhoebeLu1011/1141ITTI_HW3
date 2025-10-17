// music-runtime.js
(function(){
  // 把整個流程包成 bootstrap，React 掛載後才呼叫
  function bootstrap(){
    // === 你原本的設定 ===
    const PLAYLIST_ID = '-lP7qjXsI1RZ-Iutny';

    // === 儲存鍵值（localStorage key）===
    const LS_ID = 'KKBOX_CLIENT_ID';
    const LS_SECRET = 'KKBOX_CLIENT_SECRET';
    const LS_TOKEN = 'KKBOX_TOKEN';
    const LS_EXP = 'KKBOX_TOKEN_EXP';

    // === 就近抓取 DOM（由 React 渲染出來）===
    const strip = document.getElementById('kkx-strip');
    const dots = document.getElementById('kkx-dots');
    const prevBtn = document.querySelector('.kkx-nav.prev');
    const nextBtn = document.querySelector('.kkx-nav.next');
    const gearBtn = document.getElementById('kkx-gear');
    const admin = document.getElementById('kkx-admin');
    const closeBtn = document.getElementById('kkx-close');
    const idInput = document.getElementById('kkx-client-id');
    const secretInput = document.getElementById('kkx-client-secret');
    const getTokenBtn = document.getElementById('kkx-get-token');
    const clearBtn = document.getElementById('kkx-clear');
    const statusP = document.getElementById('kkx-status');

    // === 你原本的 functions 全部保留（fetchToken / saveCreds / saveToken / getCachedToken / ensureToken / fetchPlaylistTracks / render / updateDots / snapToNearest / 事件註冊等等）===
    // ⚠️ 注意：原本檔案最底部的「(async function init(){...})();」請移到下面這個 bootstrap() 裡面執行

    // ===== 啟動 =====
    (async function init(){
      try{
        const json = await fetchPlaylistTracks(PLAYLIST_ID);
        render(json?.data || []);
        updateDots();
      }catch(err){
        if (strip) {
          strip.innerHTML = `<div style="padding:16px;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:12px">
            無法載入清單：${(err && err.message)||err}
          </div>`;
        }
      }
    })();
  }

  // 讓 React 可以呼叫
  window.KKX_bootstrap = bootstrap;
})();

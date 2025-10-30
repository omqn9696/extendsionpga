// ==UserScript==
// @name         search land
// @namespace    https://pixels.xyz/
// @version      1.1
// @description  Tự động click ruộng phù hợp (trồng, tưới, cắt) theo item đang cầm. Có hiệu ứng chuột thật qua HUD tránh ban.
// @author       Drayke
// @icon         https://play.pixels.xyz/favicon/favicon.ico
// @match        https://pixels.guildpal.com/*
// @match        https://play.pixels.xyz/*
// @connect      pixels-api.xyz
// @grant        GM.xmlHttpRequest
// @grant        GM_addStyle
// @grant        unsafeWindow

// ==/UserScript==

(function () {
  "use strict";
function formatCountdown(ms) {
  const diff = ms - Date.now();
  if (diff <= 0) return "✅ Ready";
  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2,"0")}s`;
  return `${sec}s`;
}

let countdownTimer;

  let panel = null;
  let landsCache = [];
    const setInputValue = (farmLand) => {
        const input = document.querySelector('.LandAndTravel_numberInput__Re9sf');
        const triggerBox = document.querySelector('.LandAndTravel_option__P_QSA');
        if (!input || !triggerBox) return;

        setTimeout(() => {
            triggerBox.click();
            input.focus();
            input.click();
            Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, farmLand);
            input.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                if (input.value === farmLand) {
                    const confirmButton = document.querySelector('.LandAndTravel_optionButtons__5tDIJ button');
                    if (confirmButton) {
                        confirmButton.click();
                        clearTable();
                    }
                }
            }, 500);
        }, 500);
    };
    unsafeWindow.setInputValue = setInputValue;

  /************** CSS **************/
  GM_addStyle(`
    #pixels-land-panel {
      position: fixed; top: 20px; right: 20px;
      z-index: 99999; width: 420px; max-height: 40vh;
      background: #111; color: #eee; border-radius: 12px;
      border: 1px solid #333; box-shadow: 0 4px 16px rgba(0,0,0,.4);
      font-family: system-ui, Segoe UI, Roboto, sans-serif; font-size: 13px;
      overflow: hidden;
    }
    #pixels-land-panel header {
      display: flex; align-items: center; justify-content: space-between;
      background: #181818; padding: 8px 12px; border-bottom: 1px solid #222;
    }
    #pixels-land-panel header button {
      background: #2b7; color: #000; font-weight: 600;
      border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer;
    }
    #pixels-land-panel table { width: 100%; border-collapse: collapse; }
    #pixels-land-panel th, #pixels-land-panel td {
      padding: 6px 8px; border-bottom: 1px solid #222; text-align: left;
    }
    #pixels-land-panel th { background: #151515; position: sticky; top: 0; }
    #pixels-land-panel tr:hover { background: #1b1b1b; }
    #pixels-land-panel .ok { color: #7f7; font-weight: 600; }
  `);

  /************** FETCH DATA **************/

async function fetchLands() {
  // ✅ dùng let để có thể thay đổi giá trị
    let land = { land: true, water: true, space: true };
    let industry = 'mine';

    if (unsafeWindow.mine_tiger == 4) {
        land = { land: false, water: false, space: true };
    }else{

        land = { land: false, water: true, space: false };
    }

    if (unsafeWindow.farm_type == 'mine') {
        industry = 'mine';
    } else {
        industry = 'soil';
    }
  return new Promise((resolve, reject) => {



    GM.xmlHttpRequest({
      method: "POST",
      url: "https://pixels-api.xyz/API/load_data.php",
      headers: {
        "accept": "*/*",
        "content-type": "application/json",
        "x-requested-with": "XMLHttpRequest",
        "referer": "https://play.pixels.xyz/"
      },
      data: JSON.stringify({
        pid: "6602a183ca1af871f122cc9b",
        operation: "fetchDataRequest",
        extra: {
          industry: industry,
          tier: 4,
          selectedLandTypes: land,
          selectedBoost: true,
          filters: {}
        },
        user_acde: "uKmSJZyJjeKmXMU04hSr",
        version: "503"
      }),
      onload: (r) => {
        try {
          const json = JSON.parse(r.responseText);
          const arr = Array.isArray(json?.data) ? json.data : [];
          resolve(arr);
        } catch (e) {
          console.error("❌ Parse error:", e);
          reject(e);
        }
      },
      onerror: reject
    });
  });
}

    /************** RENDER **************/
function renderTable(list) {
  const tbody = panel.querySelector("tbody");
  clearInterval(countdownTimer);

  // 🧹 1️⃣ Lọc: chỉ lấy land có total > 4
  const filtered = list.filter(x => (x.total ?? 0) > 4);

  // 🔃 2️⃣ Sắp xếp: Ready (nextFinish == 0 hoặc available == total) lên đầu
  const sorted = [...filtered].sort((a, b) => {
    const aNext = (a.finishing || []).filter(v => v > Date.now()).sort((x, y) => x - y)[0] || 0;
    const bNext = (b.finishing || []).filter(v => v > Date.now()).sort((x, y) => x - y)[0] || 0;

    const aReady = a.available === a.total || aNext === 0;
    const bReady = b.available === b.total || bNext === 0;

    if (aReady && !bReady) return -1;
    if (!aReady && bReady) return 1;
    return aNext - bNext;
  });

  // 🧱 3️⃣ Hiển thị
  tbody.innerHTML = sorted.length
    ? sorted
        .map((x, i) => {
          const nextFinish = (x.finishing || [])
            .filter(v => v > Date.now())
            .sort((a, b) => a - b)[0] || 0;
          const id = `cd_${i}`;
          const rowClass = (x.available === x.total || nextFinish === 0) ? "ready" : "";
          return `
            <tr class="${rowClass}">
              <td>${i + 1}</td>
              <td><button onclick="window.setInputValue('${x.landId.replace("pixelsNFTFarm-", "")}')">${x.landId.replace("pixelsNFTFarm-", "")}</button></td>
              <td>${x.total ?? 0}</td>
              <td class="${x.available === 0 ? "bad" : "ok"}">${x.available ?? 0}</td>
              <td id="${id}" data-finish="${nextFinish}">
                ${x.available === x.total ? "✅ Ready" : (nextFinish ? "…" : "–")}
              </td>
            </tr>`;
        })
        .join("")
    : `<tr><td colspan="5" style="color:#888;">Không có land nào đủ điều kiện (total > 4)</td></tr>`;

  // ⏱ 4️⃣ Cập nhật countdown mỗi giây
  countdownTimer = setInterval(() => {
    document.querySelectorAll("[data-finish]").forEach(el => {
      const finish = +el.dataset.finish;
      if (finish > 0) el.textContent = formatCountdown(finish);
    });
  }, 1000);
}

  /************** CREATE PANEL **************/
  async function openPanel() {
    if (panel) return; // tránh mở trùng
    panel = document.createElement("div");
    panel.id = "pixels-land-panel";
    panel.innerHTML = `
      <header>
        <div><strong>🌾 Land Table</strong></div>
        <div style="display:flex; gap:6px;">
          <button id="fetchLandBtn">Refresh</button>
          <button id="closeLandBtn" style="background:#333;color:#eee;">×</button>
        </div>
      </header>
      <div style="overflow:auto; max-height: calc(80vh - 45px)">
        <table>
         <thead>
  <tr><th>#</th><th>Land ID</th><th>Total</th><th>Available</th><th>Countdown</th></tr>
</thead>
          <tbody><tr><td colspan="4" style="color:#aaa;">Loading...</td></tr></tbody>
        </table>
      </div>`;
    document.body.appendChild(panel);

    const btnRefresh = panel.querySelector("#fetchLandBtn");
    const btnClose = panel.querySelector("#closeLandBtn");

    btnRefresh.onclick = async () => {
      btnRefresh.textContent = "Loading...";
      const lands = await fetchLands();
      landsCache = lands;
      renderTable(lands);
      btnRefresh.textContent = "Refresh";
    };

    btnClose.onclick = closePanel;

    try {
      const lands = await fetchLands();
      landsCache = lands;
      renderTable(lands);
    } catch (e) {
      console.error("Fetch failed", e);
    }
  }
  /************** CLOSE PANEL **************/
  function closePanel() {
    if (panel) {
      panel.remove();
      panel = null;
    }
  }

  /************** EXPORT GLOBAL **************/
  unsafeWindow.openPanel = openPanel;
  unsafeWindow.closePanel = closePanel;
})();

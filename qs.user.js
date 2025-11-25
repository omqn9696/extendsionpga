// ==UserScript==
// @name        Auto qs
// @namespace    https://d31ss916pli4td.cloudfront.net/uploadedAssets/ugc/objects/obj_ugc-martian-space-kid-WXtRrPJR.png
// @version      1.3
// @description  tự động qs 60S
// @author       Drayke
// @match        *://play.pixels.xyz/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    window.speed_up = 0;
    let lastCollectTime = 0; // thời gian gọi cuối (ms)
    const WEBHOOK_URL = "https://n8n.exquisitefly.net/webhook/87751bd6-99dd-46b6-8893-7e023d97b636";
     window.addEventListener("message", onMessage);
    function onMessage(mess) {


        if(mess.data.func === "updatePlayerStorages" &&  "rpc-request" === mess.data.protocol){
             const yld = calcTigerFromChests(mess.data.args[2])
             window.pont_storage = yld.totalPoints
        }
        if(mess.data.func === "updateInventoryItems" &&  "rpc-request" === mess.data.protocol){
                        console.log(mess)
             window.pont_ivt = getTigerPoints(mess.data.args[0]);
        }
    }
    function calcTigerFromChests(chests) {
    const POINT_MAP = {
        1: 1,
        2: 3,
        3: 7,
        4: 12,
        5: 20
    };

    const yieldMap = {};   // gộp quantity theo id
    let totalPoints = 0;

    for (const chest of chests) {
        const slots = chest?.storage?.slots;
        if (!slots) continue;

        for (const key in slots) {
            const slot = slots[key];
            const id = slot?.item;
            if (!id) continue;

            // Chỉ lấy dạng itm_yield_*
            if (!id.startsWith("itm_yield_")) continue;

            // Gộp quantity theo id
            if (!yieldMap[id]) yieldMap[id] = 0;
            yieldMap[id] += slot.quantity || 0;
        }
    }

    // Tính điểm
    for (const id in yieldMap) {
        const qty = yieldMap[id];                  // tổng số item
        const tier = Number(id.split("_").pop());  // số cuối cùng

        const point = POINT_MAP[tier] || 0;
        totalPoints += qty * point;
    }

    return {
        yields: yieldMap,
        totalPoints
    };
}

    function getTigerPoints(itm = window.itm) {
    const POINT_MAP = {
        1: 1,
        2: 3,
        3: 7,
        4: 12,
        5: 20
    };

    let total = 0;

    for (const key in itm) {
        const slot = itm[key];
        if (!slot?.id) continue;

        if (slot.id.startsWith("itm_yield_")) {
            const parts = slot.id.split("_");
            const tier = Number(parts[parts.length - 1]);
            const points = POINT_MAP[tier] || 0;
            total += points * (slot.quantity ?? 1);
        }
    }

    return total;
}
    async function safeCollectReadyStations() {
        const now = Date.now();
        if (now - lastCollectTime < 5_000) {
            // 🚫 Nếu chưa đủ 10 giây thì bỏ qua
            const remain = ((5_000 - (now - lastCollectTime)) / 1000).toFixed(1);
            // console.log(`⏳ Chờ ${remain}s nữa để collectReadyStations`);
            return;
        }

        lastCollectTime = now;

        try {
            // console.log("⚙️ Gọi collectReadyStations()");
            await collectReadyStations();
        } catch (err) {
            //console.error("❌ Lỗi khi gọi collectReadyStations:", err);
        }
    }
    window.click_qs = async function (a = "click") {
        function delay(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

        function findFiberKey(el) {
            const props = Object.getOwnPropertyNames(el);
            return props.find(k => k.startsWith("__reactFiber"));
        }
        function reactClick(el, child = false) {
            const fiberKey = findFiberKey(el);
            if (!fiberKey) return console.warn("⚠️ Không tìm thấy fiber key");
            const fiber = el[fiberKey];
            const target = child ? fiber?.child : fiber;
            const onClick = target?.pendingProps?.onClick;
            if (typeof onClick === "function") {
                onClick({});
            } else {
            }
        }

        if (a === "click") {
            await delay(500); // ⏳ đợi nửa giây để UI render nút "Finish"
            const el = document.querySelector(`[class*="Speedup_buttons__7X1WE"]`);
            if (!el) return console.warn("❌ Không tìm thấy nút Finish");
            reactClick(el, true); // child.pendingProps.onClick()
        }

        else if (a === "confirm") {
            await delay(700); // ⏳ đợi thêm chút để popup confirm mount hoàn toàn
            const els = document.querySelectorAll(
                `[class*="Speedup_confirmButton__5Lfo0 commons_pushbutton__7Tpa3 commons_green__F7dVP"]`
            );
            const el = els[1] || els[0];
            if (!el) return console.warn("❌ Không tìm thấy nút Confirm");
            reactClick(el);
        }

        else {
        }
    };
    function waitForOnGameEvent(callback) {
        const check = setInterval(() => {
            if (typeof window.onGameEvent === "function") {
                clearInterval(check);
                callback();
            }
        }, 300);
    }
    waitForOnGameEvent(() => {
        window.onGameEvent('GAME_INITIATED', handleRoomLoaded);
        window.onGameEvent("PLAYER_COIN_INVENTORY_CHANGE", show_qs);

    })
  async function send_gacha(gacha) {
    const payload = {
        status: "gacha",
        source: "taskboard",
        at: new Date()
            .toLocaleString("en-CA", { timeZone: "Asia/Ho_Chi_Minh", hour12: false })
            .replace(",", ""),
        data: gacha,
    };

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
         return 'done';
        } else {

        }
    } catch (err) {

    }
}


    function handleRoomLoaded(data2 = null) {
        const room = window.pga.helpers.getRoomScene();
        if (room) {
            room.stateManager.room.onMessageHandlers.events["*"].push(handleRoomEvents);
        }
    }
    function handleRoomEvents(stateEvent, data2) {
            if('presentUI' === stateEvent &&
               data2.ui === 'speedUp' &&
               window.pga.helpers.getReduxValue().speedUp.show &&
               window.pga.helpers.getReduxValue().speedUp.inUseByMe === 0 &&  window.speed_up > 0){
                const speedUp = window.pga.helpers.getReduxValue().speedUp;
                const now = Date.now();
                const remainingSeconds = Math.max(0, Math.floor((speedUp.until - now) / 1000));
                if(remainingSeconds < 60){
                    window.click_qs('click');
                    window.click_qs('confirm');

                }

            }
        if('gachaOpened'=== stateEvent){
         send_gacha(data2)
        }
        }
    async function click_hub() {
        const aid = getYield3();
        const id = aid[0].id;
        const mids = getHearthEntities();
        if (!mids || !mids[0]) return console.warn("❌ Không tìm thấy hearth entity");

        const redux = window.pga.helpers.getReduxValue().storage;

        // -----------------------------
        // 1) CẦM ĐỒ (nếu chưa cầm hoặc cầm sai)
        // -----------------------------
        if (redux.selectedEquipment === -1) {
            await window.pick_ball(id);
        } else {
            const current = redux.selectedSlot?.item || "";
            if (current !== id) {
                await window.pick_ball(id);
            }
        }

        // Cho Redux update state
        await new Promise(r => setTimeout(r, 80));

        // -----------------------------
        // 2) LẤY ENTITY
        // -----------------------------
        const room = window.pga.helpers.getRoomScene();
        const ent = room?.entities?.get(mids[0].mid);

        if (!ent) return console.warn("❌ Không tìm thấy entity hub");

        // -----------------------------
        // 3) TẠO POINTER EVENT GIẢ
        // -----------------------------
        const pointer = makePointerForEntity(ent) || {
            worldX: ent.x,
            worldY: ent.y,
            pointerId: 1,
            isDown: true,
            isUp: false,
            leftButtonDown: true,
            rightButtonDown: false,
            event: {}
        };

        // -----------------------------
        // 4) CLICK ENTITY
        // -----------------------------
        try {
            ent.clicked(pointer, {});
        } catch (e) {
            console.error("❌ Click hub error:", e);
        }
    }

    window.click_hub = click_hub
    function getHearthEntities() {
        const room = window.pga?.helpers?.getRoomScene?.();
        if (!room?.entities) return [];

        const list = [...room.entities.values()];

        return list.filter(e => {
            const id = e?.gameEntity?.id || "";
            return  id === "ent_hearth_2"

        });
    }
function getYield3() {
    const inv = window.pga?.helpers?.getInventoryItems?.();
    if (!inv) return [];

    return inv.filter(it => it.id?.startsWith("itm_yield_3_"));
}
    function show_qs(data) {
        try {
            if (!data || !Array.isArray(data.coinInventory)) return;
            if (data.currencyId === "cur_speedup") {
                const found = data.coinInventory.find(c => c.currencyId === "cur_speedup");
                const balance = found ? found.balance : 0;

                if (balance !== window.speed_up) {
                    window.speed_up = balance;
                    ensureHudExists()
                }
            }
        } catch (err) {
            console.warn("❌ Lỗi show_qs:", err);
        }
    }
    function ensureHudExists() {
        const baseHud = document.querySelector(".Hud_itemsTotalValueContainerPga");
        const existing = document.querySelector(".Hud_itemsTotalValueContainerPga.left");
        if (!baseHud) {
            console.warn("⚠️ Chưa có .Hud_itemsTotalValueContainerPga gốc trong DOM");
            return;
        }

        if (!existing) {
            const html = `
       <div class="Hud_itemsTotalValueContainerPga left" style="left:0;right:unset">
        <img
          src="https://d31ss916pli4td.cloudfront.net/uploadedAssets/i/itm_speedup_copon/b7ef50f3-c395-449c-a81f-86c29f292dab.png"
          style="width: 10px; height: 10px; margin-right: 3px;"
        >
        <div class="Hud_totalValuePga">${window.speed_up.toLocaleString()}</div>
        <img
          src="https://d31ss916pli4td.cloudfront.net/uploadedAssets/i/itm_tempreapersaura/1a02beec-deb0-40e5-b4e8-0695e5113a4a.png?v6"
          style="width: 10px; height: 10px; margin-right: 3px;"
        >
        <div class="Hud_totalValuePga">${window.pont_storage + window.pont_ivt}</div>
      </div>
    `;
            baseHud.insertAdjacentHTML("afterend", html);
        }
        else {
            const valueEl = existing.querySelector(".Hud_totalValuePga");
            if (valueEl && valueEl.textContent.replace(/,/g, "") !== String(window.speed_up)) {
                valueEl.textContent = window.speed_up.toLocaleString();

                // 🎨 highlight khi số thay đổi
                valueEl.style.transition = "color 0.3s";
                valueEl.style.color = "#00ff88";
                setTimeout(() => (valueEl.style.color = ""), 400);
            }
        }
    }
    async function collectReadyStations() {
  const room = window.pga?.helpers?.getRoomScene?.();
  if (!room?.entities) return;

  // 🔍 Lọc tất cả entity sẵn sàng
  const allReady = [...room.entities.values()].filter(e => {
    if (!e) return false;
    const id = e?.gameEntity?.id?.toLowerCase() || "";
    return (
      (e.state === "ready" || e.state === "2egg") &&
      !id.includes("portal") &&
      !id.includes("road")
    );
  });

  // 🥚 Ưu tiên coop + sluggery
  const priority = allReady.filter(e => {
    const id = e?.gameEntity?.id?.toLowerCase() || "";
    return id.includes("ent_coop") || id.includes("ent_sluggery");
  });

  const others = allReady.filter(e => !priority.includes(e));
  let ready = [...priority, ...others];

  // 🚫 Loại bỏ entity trùng mid
  const seen = new Set();
  ready = ready.filter(e => {
    const mid = e?.mid || e?.gameEntity?.mid;
    if (!mid || seen.has(mid)) return false;
    seen.add(mid);
    return true;
  });

  // 🖱️ Click từng entity
  for (const ent of ready) {
    const id = ent?.gameEntity?.id || "";
    // console.log(`🐔 Collecting: ${id} (${ent.mid})`);
    try {
      ent.clicked(makePointerForEntity(ent), {});
      await new Promise(r => setTimeout(r, 150 + Math.random() * 80));
    } catch (err) {
      //console.warn(`⚠️ Lỗi khi click ${id}:`, err);
    }
  }
}
    function makePointerForEntity(entity) {
        const px = entity?.propCache?.position?.x ?? entity.x ?? 0;
        const py = entity?.propCache?.position?.y ?? entity.y ?? 0;
        return {
            x: px, y: py,
            worldX: entity.x ?? px,
            worldY: entity.y ?? py,
            center: { x: px, y: py },
            leftButtonReleased: () => true,
            rightButtonReleased: () => false,
            leftButtonDown: () => false,
            rightButtonDown: () => false,
        };
    }
    function waitForBody() {
        return new Promise((resolve) => {
            if (document.body) return resolve(document.body);
            const observer = new MutationObserver(() => {
                if (document.body) {
                    observer.disconnect();
                    resolve(document.body);
                }
            });
            observer.observe(document.documentElement, { childList: true });
        });
    }

    async function onHudAddedDeep(callback) {
        const body = await waitForBody();

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;

                    // Kiểm tra chính node hoặc các phần tử con
                    if (node.classList?.contains('Hud_itemsTotalValueContainerPga')) {
                        callback(node);
                    } else {
                        const found = node.querySelector('.Hud_itemsTotalValueContainerPga');
                        if (found) callback(found);
                    }
                });
            }
        });

        observer.observe(body, { childList: true, subtree: true });
    }
    onHudAddedDeep((hud) => {
        ensureHudExists()
        safeCollectReadyStations()
    });


})();

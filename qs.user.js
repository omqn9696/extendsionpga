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
               window.pga.helpers.getReduxValue().speedUp.inUseByMe === 0 ){
                const speedUp = window.pga.helpers.getReduxValue().speedUp;
                const now = Date.now();
                const remainingSeconds = Math.max(0, Math.floor((speedUp.until - now) / 1000));
                if(remainingSeconds < 60){
                    window.click_qs('click');
                    window.click_qs('confirm');

                }

            }

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
    });


})();

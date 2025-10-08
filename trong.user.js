// ==UserScript==
// @name         Auto Trồng Cây - Pixels
// @namespace    https://pixels.xyz/
// @version      1.1
// @description  Tự động click ruộng phù hợp (trồng, tưới, cắt) theo item đang cầm. Có hiệu ứng chuột thật qua HUD tránh ban.
// @author       Drayke
// @icon         https://play.pixels.xyz/favicon/favicon.ico
// @match        *://play.pixels.xyz/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  /************ 🪄 DI CHUYỂN HUD ************/
  async function moveHudTo(x, y, steps = 20, delay = 8) {
    const hud = document.querySelector('[class^="Hud_selectedItem__"]');
    if (!hud) return;
    const m = hud.style.transform.match(/translate3d\(([\d.]+)px,\s*([\d.]+)px/);
    let curX = m ? parseFloat(m[1]) : 0;
    let curY = m ? parseFloat(m[2]) : 0;
    const dx = (x - curX) / steps;
    const dy = (y - curY) / steps;
    for (let i = 1; i <= steps; i++) {
      curX += dx;
      curY += dy;
      hud.style.transform = `translate3d(${curX}px, ${curY}px, 0px)`;
      await new Promise(r => setTimeout(r, delay + Math.random() * 3));
    }
  }

  /************ 💬 THÔNG BÁO TRONG GAME ************/
  function showMessage(msg) {
    const player = window.pga?.helpers?.getRoomScene?.()?.selfPlayer;
    if (player) player.showChatMessage(msg);
    console.log(msg);
  }

  /************ 🖱️ CLICK ENTITY ************/
  async function simulateEntityClick(entity) {
    try {
      const room = window.pga?.helpers?.getRoomScene?.();
      const cam = room?.cameras?.main;
      const canvas = document.querySelector("canvas");
      if (!canvas || !cam) return;

      const worldX = entity.x ?? 0, worldY = entity.y ?? 0;
      const ex = (worldX - cam.worldView.x) * cam.zoom;
      const ey = (worldY - cam.worldView.y) * cam.zoom;

      await moveHudTo(ex, ey, 18, 6);

      const pointer = {
        worldX,
        worldY,
        center: { x: worldX, y: worldY },
        position: { x: worldX, y: worldY },
        leftButtonReleased: () => true,
        leftButtonDown: () => false,
        rightButtonReleased: () => false,
        rightButtonDown: () => false,
        middleButtonReleased: () => false,
        middleButtonDown: () => false,
      };
      entity.clicked(pointer, {});
    } catch (err) {}
  }

  /************ 🌾 AUTO TRỒNG / TƯỚI / CẮT ************/
  let STOP_AUTO = false;

  async function clickAllCropsSmart() {
    STOP_AUTO = false;

    const room = window.pga?.helpers?.getRoomScene?.();
    if (!room?.entities) return showMessage("❌ Không tìm thấy room.entities");

    const entities = Array.from(room.entities.values());
    const redux = window.pga?.helpers?.getReduxValue?.()?.storage;
    const selectedItemId = redux?.selectedItem?.id;
    const selectedQty = redux?.selectedQty ?? 0;

    if (!selectedItemId) return showMessage("⚠️ Không có item nào đang được cầm!");
    if (selectedQty < 1) return showMessage("⚠️ Hết item để sử dụng!");

    let targetStates = [];
    let reverseMode = false; // 🚀 nếu true → chạy ngược
    if (selectedItemId === "itm_rustyWateringCan") {
      targetStates = ["planted"];
      reverseMode = true; // 🔁 khi tưới, chạy ngược
    } else if (selectedItemId.endsWith("eeds")) targetStates = ["empty"];
    else if (selectedItemId.startsWith("itm_shears_")) targetStates = ["grown"];
    else return showMessage("⚠️ Item này không hợp lệ cho auto.");

    const crops = entities.filter(ent => {
      const id = ent?.gameEntity?.id;
      const s = (ent?.state?.state || ent?.state || ent?.properties?.state || ent?.properties?.growthStage || "").toString().toLowerCase();
      return id === "ent_allcrops" && targetStates.includes(s);
    });

    if (!crops.length) return showMessage("✅ Không có ô ruộng phù hợp để click.");

    const rows = {};
    for (const c of crops) {
      const y = Math.round(c.y / 10) * 10;
      if (!rows[y]) rows[y] = [];
      rows[y].push(c);
    }

    let sortedY = Object.keys(rows).map(Number).sort((a, b) => a - b);
    if (reverseMode) sortedY.reverse(); // 🔁 nếu watering → đi ngược hàng (dưới lên)

    showMessage(`🌾 Auto ${crops.length} ô | ${reverseMode ? "Reverse" : "Zigzag"} mode`);
    console.log("⏳ Nhấn [S] để DỪNG KHẨN CẤP!");

    let reverse = false;
    for (const y of sortedY) {
      if (STOP_AUTO) return showMessage("🛑 Auto dừng khẩn cấp!");

      let row = rows[y];
      row.sort((a, b) => a.x - b.x);
      if (reverse) row.reverse();

      for (const crop of row) {
        if (STOP_AUTO) return showMessage("🛑 Auto dừng khẩn cấp!");

        const curQty = window.pga?.helpers?.getReduxValue?.()?.storage?.selectedQty ?? 0;
        if (curQty < 1) {
          showMessage("❌ Hết item giữa chừng — dừng auto.");
          return;
        }

        await simulateEntityClick(crop);
        await new Promise(r => setTimeout(r, 10 + Math.random() * 10));
      }

      reverse = !reverse;
    }

    if (!STOP_AUTO) showMessage("✅ Hoàn tất auto!");
  }

  /************ ⌨️ PHÍM TẮT ************/
  document.addEventListener("keydown", e => {
    if (e.code === "Delete") clickAllCropsSmart(); // Bắt đầu auto
    if (e.code === "Space") STOP_AUTO = true; // Dừng khẩn cấp
  });
})();

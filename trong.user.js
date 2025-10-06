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

  /************ ⚙️ HÀM HIỂN THỊ THÔNG BÁO ************/
  function showMessage(msg) {
    const player = window.pga?.helpers?.getRoomScene?.()?.selfPlayer;
    if (player) player.showChatMessage(msg);
    console.log(msg);
  }

  /************ 🖱️ HÀM CLICK CÓ DI CHUYỂN CHUỘT ************/
  async function simulateEntityClick(entity) {
    try {
      const room = window.pga?.helpers?.getRoomScene?.();
      const cam = room?.cameras?.main;
      const canvas = document.querySelector("canvas");
      if (!canvas || !cam) return;

      // 🟢 Lấy toạ độ HUD (đọc trực tiếp từ transform)
      const hud = document.querySelector('[class^="Hud_selectedItem__"]');
      let hudX = window.innerWidth / 2, hudY = window.innerHeight / 2;
      if (hud) {
        const m = hud.style.transform.match(/translate3d\(([\d.]+)px,\s*([\d.]+)px/);
        if (m) { hudX = +m[1]; hudY = +m[2]; }
      }

      // 🟢 Tính vị trí entity trên màn hình
      const worldX = entity.x ?? 0, worldY = entity.y ?? 0;
      const ex = (worldX - cam.worldView.x) * cam.zoom;
      const ey = (worldY - cam.worldView.y) * cam.zoom;

      // 🟢 Di chuyển chuột mượt từ HUD đến entity
      const steps = 18;
      for (let i = 1; i <= steps; i++) {
        const cx = hudX + (ex - hudX) * (i / steps);
        const cy = hudY + (ey - hudY) * (i / steps);
        document.dispatchEvent(
          new MouseEvent("mousemove", { clientX: cx, clientY: cy, bubbles: true })
        );
        await new Promise((r) => setTimeout(r, 8 + Math.random() * 4));
      }

      // 🟢 Click thật trên canvas
      ["mousedown", "mouseup", "click"].forEach((type) =>
        canvas.dispatchEvent(
          new MouseEvent(type, { clientX: ex, clientY: ey, bubbles: true })
        )
      );

      // 🟢 Pointer object đầy đủ
      const pointer = {
        worldX,
        worldY,
        center: { x: worldX, y: worldY },
        position: { x: worldX, y: worldY },
        leftButtonReleased: () => true,
        leftButtonDown: () => false,
        leftButtonJustPressed: () => false,
        rightButtonReleased: () => false,
        rightButtonDown: () => false,
        rightButtonJustPressed: () => false,
        middleButtonReleased: () => false,
        middleButtonDown: () => false,
        middleButtonJustPressed: () => false,
      };

      entity.clicked(pointer, {});
    } catch (err) {
      console.warn("[Click Error]", err);
    }
  }

  /************ 🌾 HÀM TỰ ĐỘNG CLICK RUỘNG ************/
let STOP_AUTO = false; // 🚨 biến dừng khẩn cấp toàn cục

async function clickAllCropsSmart() {
  STOP_AUTO = false; // reset trước mỗi lần chạy

  const room = window.pga?.helpers?.getRoomScene?.();
  if (!room?.entities) return showMessage("❌ Không tìm thấy room.entities");

  const entities = Array.from(room.entities.values());
  const redux = window.pga?.helpers?.getReduxValue?.()?.storage;
  const selectedItemId = redux?.selectedItem?.id;
  const selectedQty = redux?.selectedQty ?? 0;

  if (!selectedItemId) return showMessage("⚠️ Không có item nào đang được cầm!");
  if (selectedQty < 1) return showMessage("⚠️ Hết item để sử dụng!");

  // 🎯 Xác định loại hành động
  let targetStates = [];
  if (selectedItemId === "itm_rustyWateringCan") targetStates = ["planted"];
  else if (selectedItemId.endsWith("Seeds")) targetStates = ["empty"];
  else if (selectedItemId.startsWith("itm_shears_")) targetStates = ["grown"];
  else return showMessage("⚠️ Item này không hợp lệ cho auto.");

  // 🌾 Lọc crop phù hợp
  const crops = entities.filter((ent) => {
    const id = ent?.gameEntity?.id;
    const s =
      (ent?.state?.state ||
        ent?.state ||
        ent?.properties?.state ||
        ent?.properties?.growthStage ||
        ""
      ).toString().toLowerCase();
    return id === "ent_allcrops" && targetStates.includes(s);
  });

  if (!crops.length) return showMessage("✅ Không có ô ruộng phù hợp để click.");

  // 🧭 Gom nhóm ruộng theo hàng (theo y, làm tròn)
  const rows = {};
  for (const c of crops) {
    const y = Math.round(c.y / 10) * 10;
    if (!rows[y]) rows[y] = [];
    rows[y].push(c);
  }

  // 🔀 Sắp xếp hàng theo y tăng dần
  const sortedY = Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b);

  showMessage(`🌾 Auto ${crops.length} ô | Zigzag theo X`);
  console.log("⏳ Nhấn [S] để DỪNG KHẨN CẤP!");

  let reverse = false;
  for (const y of sortedY) {
    if (STOP_AUTO) {
      showMessage("🛑 Auto dừng khẩn cấp!");
      break;
    }

    let row = rows[y];
    row.sort((a, b) => a.x - b.x);
    if (reverse) row.reverse();

    for (const crop of row) {
      if (STOP_AUTO) {
        showMessage("🛑 Auto dừng khẩn cấp!");
        return;
      }

      const curQty = window.pga?.helpers?.getReduxValue?.()?.storage?.selectedQty ?? 0;
      if (curQty < 1) {
        showMessage("❌ Hết item giữa chừng — dừng auto.");
        return;
      }

      await simulateEntityClick(crop);
      await new Promise((r) => setTimeout(r, 10 + Math.random() * 10)); // ⚡ click 10–20ms
    }

    reverse = !reverse; // đảo hướng mỗi hàng
  }

  if (!STOP_AUTO) showMessage("✅ Hoàn tất auto zigzag!");
}
  /************ 🎮 PHÍM TẮT ************/
  document.addEventListener("keydown", (e) => {
    if (e.code === "Delete") {
     clickAllCropsSmart();
    }
      if (e.code === "space") {
    STOP_AUTO = true;
    }
  });

 // console.log("✅ [Auto Farm] Nhấn [Space] để trồng/tưới/cắt tự động | [Del] để xoá log.");
})();

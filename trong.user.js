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
    let STOP_AUTOMINE = false
    function goToVilla() {
        const targets = document.querySelectorAll(".Hud_outside__zzIGQ");
        for (const el of targets) {
            const img = el.querySelector('img[aria-label="Land and Bookmarks"]');
            if (!img) continue;

            el.click();
            setTimeout(() => {
                const btnContainer = document.querySelector(".LandAndTravel_customHeader__goUPo");
                const btn = btnContainer && [...btnContainer.querySelectorAll("button")]
                .find(b => b.textContent.trim() === "Go to Terra Villa");
                btn?.click();
            }, 1000);
            break;
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
    function collection(data){
        if( data.entity == "ent_sluggery" || data.entity == "ent_coop")
        collectReadyStations()
    }
    function waitForOnGameEvent(callback) {
        const check = setInterval(() => {
            if (typeof window.onGameEvent === "function") {
                clearInterval(check);
                callback();
            }
        }, 300);
    }
    function stop_auto(){
        if(!STOP_AUTO){
            STOP_AUTO = true
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
    function playBeep(type = "start") {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Chọn tần số & thời lượng theo loại
        let freq = 440, dur = 0.2;
        switch (type) {
            case "start": freq = 880; dur = 0.25; break;     // beep cao bắt đầu
            case "stop": freq = 200; dur = 0.4; break;       // beep trầm dừng
            case "done": freq = 600; dur = 0.3; break;       // beep trung khi hoàn tất
            case "error": freq = 120; dur = 0.5; break;      // lỗi
        }

        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + dur);
    }
    function drawAutoStatus(isActive = true, text = "AUTO MINING ACTIVE") {
        let overlay = document.getElementById("autoStatusOverlay");

        // ❌ Nếu dừng → xóa và ngắt blink
        if (!isActive) {
            if (overlay) {
                clearInterval(overlay.blinkInterval);
                overlay.remove();
            }
            return;
        }

        // ✅ Nếu chưa tồn tại → tạo mới
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "autoStatusOverlay";
            Object.assign(overlay.style, {
                position: "fixed",
                top: "18px",
                left: "50%",
                transform: "translateX(-50%)",
                padding: "10px 22px",
                fontFamily: "monospace",
                fontSize: "15px",
                fontWeight: "700",
                letterSpacing: "1px",
                color: "#fff",
                textShadow: "0 0 8px rgba(0,255,140,0.8)",
                background: "red", // 🌑 nền xanh đậm bán trong suốt
                border: "1px solid rgba(0,255,150,0.7)",
                borderRadius: "12px",
                boxShadow: "0 0 20px rgba(0,255,140,0.25)",
                backdropFilter: "blur(5px)", // mờ nền phía sau
                zIndex: 99999,
                pointerEvents: "none",
                opacity: 0.95,
                transition: "opacity 0.3s ease",
            });
            document.body.appendChild(overlay);
        }

        // 🔠 Cập nhật nội dung
        overlay.innerHTML = `⛏️ ${text}`;

        // 🌟 Nhấp nháy nhẹ (hiệu ứng breathing)
        if (!overlay.blinkInterval) {
            overlay.blinkInterval = setInterval(() => {
                overlay.style.opacity = overlay.style.opacity === "0.5" ? "0.95" : "0.5";
            }, 800);
        }
    }
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
        if (!player) return;

        const text = String(msg).trim().toLowerCase();

        // 🎯 Các mẫu đặc biệt
        const templates = {
            "stop": "Auto Stop",
            "not_item": "Item không phù hợp",
            "end_item": "Hết item để sử dụng",
            "finish": "Auto Done",
            "start": "Auto star",
            "error": "❌ Có lỗi xảy ra!",
        };

        // Nếu msg nằm trong templates → hiển thị câu mẫu
        if (templates[text]) {
            player.showChatMessage(templates[text]);
        } else {
            // Ngược lại → hiển thị nguyên văn
            player.showChatMessage(msg);
        }
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
        let reverseMode = false;

        if (selectedItemId === "itm_rustyWateringCan") {
            targetStates = ["planted"];
            reverseMode = true; // 🔁 khi tưới, chạy ngược
        } else if (selectedItemId.endsWith("eeds")) targetStates = ["empty"];
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

            // ⚠️ Nếu đang tưới nước → chỉ lấy crop có utcTarget == 0
            if (selectedItemId === "itm_rustyWateringCan") {
                const target = ent?.currentState?.displayInfo?.utcTarget ?? 1;
                return id === "ent_allcrops" && targetStates.includes(s) && target === 0;
            }

            // các trường hợp còn lại (gieo hoặc cắt)
            return id === "ent_allcrops" && targetStates.includes(s);
        });

        if (!crops.length)
            return showMessage("✅ Không có ô ruộng phù hợp để click.");

        // 🧭 Gom nhóm crop theo hàng (theo y, làm tròn)
        const rows = {};
        for (const c of crops) {
            const y = Math.round(c.y / 10) * 10;
            if (!rows[y]) rows[y] = [];
            rows[y].push(c);
        }

        let sortedY = Object.keys(rows)
        .map(Number)
        .sort((a, b) => a - b);
        if (reverseMode) sortedY.reverse(); // 🔁 nếu watering → đi ngược hàng (dưới lên)

        showMessage(
            `🌾 Auto ${crops.length} ô | ${
            reverseMode ? "Reverse" : "Zigzag"
            } mode`
        );
        //console.log("⏳ Nhấn [S] để DỪNG KHẨN CẤP!");

        let reverse = false;
        for (const y of sortedY) {
            if (STOP_AUTO) return showMessage("🛑 Auto dừng khẩn cấp!");

            let row = rows[y];
            row.sort((a, b) => a.x - b.x);
            if (reverse) row.reverse();

            for (const crop of row) {
                if (STOP_AUTO) return showMessage("🛑 Auto dừng khẩn cấp!");

                // ⚠️ Kiểm tra tool health & energy
                const health =
                      window.pga?.helpers?.getReduxValue?.()?.storage?.selectedSlot?.state
                ?.displayInfo?.health ?? 999;
                const energy =
                      window.pga?.helpers?.getReduxValue?.()?.game?.player?.full?.energy
                ?.level ?? 999;

                if (health <= 0.5) {
                    STOP_AUTO = true;
                    return showMessage("🛑 Tool sắp hỏng! Dừng auto ngay!");
                }
                if (energy <= 4) {
                    STOP_AUTO = true;
                    return showMessage("🪫 Energy quá thấp (<4)! Dừng auto!");
                }

                const curQty =
                      window.pga?.helpers?.getReduxValue?.()?.storage?.selectedQty ?? 0;
                if (curQty < 1) {
                    showMessage("❌ Hết item giữa chừng — dừng auto.");
                    return;
                }

                await simulateEntityClick(crop);
                await new Promise((r) => setTimeout(r, 10 + Math.random() * 10)); // ⚡ 10–20ms
            }

            reverse = !reverse;
        }

        if (!STOP_AUTO) showMessage("✅ Hoàn tất auto!");

        function stopMsg(msg) {
            showMessage(msg);
            console.warn(msg);
        }
    }
    async function autoMineZeroDelayUltraPro_v4() {
        STOP_AUTOMINE = false;

        const room = window.pga?.helpers?.getRoomScene?.();
        if (!room?.entities) return showMessage("❌ Không tìm thấy room.entities");
        drawAutoStatus(true, "AUTO MINING ACTIVE");
        showMessage("Auto start ");
        //console.log("🧠 waiting→click, ready→double, loaded→chờ <3p, nếu tất cả >20p thì về Villa");

        let lastCheck = 0;

        // 🖱️ Di chuyển HUD (chuột ảo Pixels)
        async function moveHudTo(x, y, steps = 30, delay = 5) {
            const hud = document.querySelector('[class^="Hud_selectedItem__"]');
            if (!hud) return;

            const m = hud.style.transform.match(/translate3d\(([\d.-]+)px,\s*([\d.-]+)px/);
            let curX = m ? parseFloat(m[1]) : 0;
            let curY = m ? parseFloat(m[2]) : 0;
            const totalDist = Math.hypot(x - curX, y - curY);
            const stepsAuto = Math.max(15, Math.min(60, Math.floor(totalDist / 20)));

            const ease = t => 1 - Math.pow(1 - t, 3);

            for (let i = 1; i <= stepsAuto; i++) {
                const t = ease(i / stepsAuto);
                const nx = curX + (x - curX) * t;
                const ny = curY + (y - curY) * t;
                hud.style.transform = `translate3d(${nx}px, ${ny}px, 0px)`;
                await new Promise(r => setTimeout(r, delay));
            }
        }

        // 🧭 Tạo pointer và điều khiển chuột ảo di chuyển đúng vị trí mỏ
        async function makePointerForEntity(entity) {
            const room = window.pga?.helpers?.getRoomScene?.();
            const cam = room?.cameras?.main;
            const canvas = document.querySelector("canvas");
            if (!entity || !canvas || !cam) return null;

            // chuyển world → screen
            const worldX = entity.x ?? 0;
            const worldY = entity.y ?? 0;
            const screenX = (worldX - cam.worldView.x) * cam.zoom;
            const screenY = (worldY - cam.worldView.y) * cam.zoom;
            const rect = canvas.getBoundingClientRect();
            const targetX = rect.left + screenX;
            const targetY = rect.top + screenY;

            // 🖱️ HUD bay đến vị trí entity
            await moveHudTo(targetX, targetY);

            return {
                x: screenX,
                y: screenY,
                worldX,
                worldY,
                center: { x: worldX, y: worldY },
                position: { x: worldX, y: worldY },
                leftButtonReleased: () => true,
                rightButtonReleased: () => false,
                leftButtonDown: () => false,
                rightButtonDown: () => false,
            };
        }

        // 🔁 Vòng lặp chính
        async function loop() {
            if (STOP_AUTOMINE) {return showMessage("🛑 Dừng khẩn cấp!");drawAutoStatus(false);}

            const now = performance.now();
            const nowUTC = Date.now();

            const redux = window.pga?.helpers?.getReduxValue?.();
            const selectedItem = redux?.storage?.selectedItem?.id ?? "";
            const health = redux?.storage?.selectedSlot?.state?.displayInfo?.health ?? 9999;
            const energy = redux?.game?.player?.full?.energy?.level ?? 9999;

            // phải cầm Pickaxe
            if (!selectedItem || !selectedItem.startsWith("itm_pickaxe_")) {
                STOP_AUTOMINE = true;
                drawAutoStatus(false);
                return showMessage("⚠️ Bạn không cầm Pickaxe — auto dừng!");
            }

            // kiểm tra tool/energy
            if (now - lastCheck > 250) {
                if (health <= 1) {
                    STOP_AUTOMINE = true;
                    drawAutoStatus(false);
                    return showMessage("🪓 Tool sắp hỏng! Dừng auto!");
                }
                if (energy <= 4) {
                    STOP_AUTOMINE = true;
                    drawAutoStatus(false);
                    return showMessage("🪫 Energy quá thấp! Dừng auto!");
                }
                lastCheck = now;
            }

            // lọc các mỏ
            const entities = Array.from(room.entities.values());
          const selfPos = room.selfPlayer?.position;
            const mines = entities
            .filter((ent) => {
                const id = ent?.gameEntity?.id?.toLowerCase?.() || "";
                const s = (ent?.state?.state || ent?.state || ent?.properties?.state || "").toLowerCase();
                if (!id.startsWith("ent_mine_04")) return false;
                if (!["waiting", "ready", "loaded"].includes(s)) return false;

                const dist = Math.hypot((ent.x ?? 0) - selfPos.x, (ent.y ?? 0) - selfPos.y);
                return dist <= 350; // 🚫 bỏ qua mỏ quá xa
            })
            .map(ent => ({
                ent,
                dist: Math.hypot((ent.x ?? 0) - selfPos.x, (ent.y ?? 0) - selfPos.y)
            }))
            .sort((a, b) => a.dist - b.dist) // ⚡ chỉ sắp theo khoảng cách gần nhất
            .map(obj => obj.ent);
            if (mines.length === 0) {
                STOP_AUTOMINE = true;
                drawAutoStatus(false);
                showMessage("✅ Tất cả mỏ đã xong → Auto dừng & về Villa");
                playBeep('stop')
                return goToVilla();
            }

            let allLoaded = true;
            let allLong = true;

            for (const ent of mines) {
                const state = (ent?.state?.state || ent?.state || ent?.properties?.state || "").toLowerCase();

                try {
                    if (state === "ready") {
                        allLoaded = false;
                        const pointer = await makePointerForEntity(ent);
                        ent.clicked(pointer, {});
                        ent.clicked(pointer, {});
                    } else if (state === "waiting") {
                        allLoaded = false;
                        const pointer = await makePointerForEntity(ent);
                        ent.clicked(pointer, {});
                    } else if (state === "loaded") {
                        const utcTarget = ent?.currentState?.displayInfo?.utcTarget || 0;
                        if (utcTarget > nowUTC) {
                            const remain = (utcTarget - nowUTC) / 1000;
                            if (remain < 180 && remain > 0) {
                                allLong = false;
                                continue;
                            } else if (remain <= 0) {
                                const pointer = await makePointerForEntity(ent);
                                ent.clicked(pointer, {});
                                console.log(`⛏️ Bắt đầu lại mỏ @(${ent.x},${ent.y})`);
                                allLoaded = false;
                                allLong = false;
                            } else if (remain < 1200) {
                                allLong = false;
                            }
                        } else {
                            allLong = false;
                        }
                    }
                } catch (err) {
                    console.warn("⚠️ Lỗi click mỏ:", err);
                }
            }

            if (allLoaded && allLong) {
                STOP_AUTOMINE = true;
                drawAutoStatus(false);
                showMessage("✅ Toàn bộ mỏ đã hồi >20 phút → Tự động về Villa!");
                return goToVilla();
            }

            requestAnimationFrame(loop);
        }

        loop();
    }

    async function autoChopTreesVerticalProgressiveFast() {
        STOP_AUTO = false;

        const room = window.pga?.helpers?.getRoomScene?.();
        if (!room?.entities) return showMessage("❌ Không tìm thấy room.entities");

        const entities = Array.from(room.entities.values());

        // 🌲 Lọc cây bắt đầu bằng ent_tree và state = mature hoặc stump
        const trees = entities.filter((ent) => {
            const id = ent?.gameEntity?.id?.toLowerCase?.() || "";
            const s =
                  (ent?.state?.state ||
                   ent?.state ||
                   ent?.properties?.state ||
                   ent?.properties?.growthStage ||
                   ""
                  ).toString().toLowerCase();
            return id.startsWith("ent_tree") && ["mature", "stump"].includes(s);
        });

        if (!trees.length) return showMessage("✅ Không có cây nào để chặt.");

        // 🧭 Gom nhóm cây theo cột (theo X, làm tròn)
        const columns = {};
        for (const t of trees) {
            const x = Math.round(t.x / 10) * 10;
            if (!columns[x]) columns[x] = [];
            columns[x].push(t);
        }

        const sortedX = Object.keys(columns)
        .map(Number)
        .sort((a, b) => a - b);

        showMessage(`🌲 Auto chặt siêu tốc | Dừng khi tool sắp hỏng hoặc energy thấp`);
        console.log("⏳ Nhấn [S] để DỪNG KHẨN CẤP!");

        let reverse = false;

        for (;;) {
            const cols = reverse ? [...sortedX].reverse() : sortedX;

            for (const x of cols) {
                if (STOP_AUTO) return stopMsg("🛑 Dừng khẩn cấp!");

                let col = columns[x].sort((a, b) => a.y - b.y);
                console.log(`🌳 Chặt cột X=${x} (${col.length} cây)`);

                while (!STOP_AUTO) {
                    let active = 0;

                    for (const tree of col) {
                        if (STOP_AUTO) break;

                        // ⚠️ Kiểm tra health & energy TRƯỚC KHI CLICK
                        const redux = window.pga?.helpers?.getReduxValue?.();
                        const health =
                              redux?.storage?.selectedSlot?.state?.displayInfo?.health ?? 9999;
                        const energy = redux?.game?.player?.full?.energy?.level ?? 9999;

                        if (health <= 1) {
                            STOP_AUTO = true;
                            return showMessage("🛑 Tool sắp hỏng! Dừng auto ngay!");
                        }
                        if (energy <= 4) {
                            STOP_AUTO = true;
                            return showMessage("🪫 Energy quá thấp (<4)! Dừng auto!");
                        }

                        // 🔍 Kiểm tra trạng thái cây
                        const state =
                              (tree?.state?.state ||
                               tree?.state ||
                               tree?.properties?.state ||
                               tree?.properties?.growthStage ||
                               ""
                              ).toString().toLowerCase();

                        // 🌱 Nếu cây đã thành seed → coi như xong, bỏ qua
                        if (state === "seed") continue;

                        // 🪓 Chặt nếu còn mature hoặc stump
                        if (["mature", "stump"].includes(state)) {
                            active++;
                            await simulateEntityClick(tree);
                            await sleep(40 + Math.random() * 30); // ⚡ 40–70 ms giữa click
                        }
                    }

                    if (active === 0) {
                        console.log(`✅ Cột X=${x} xong (tất cả thành seed)!`);
                        break;
                    }

                    await sleep(80); // nghỉ ngắn giữa vòng
                }

                await sleep(120); // nghỉ nhẹ giữa hàng
            }

            reverse = !reverse; // đảo chiều sau mỗi vòng
        }

        // Helpers
        function stopMsg(msg) {
            showMessage(msg);
            console.warn(msg);
        }

        function sleep(ms) {
            return new Promise((r) => setTimeout(r, ms));
        }
    }
async function safeCheckHeldItem() {
  for (let i = 0; i < 10; i++) {
    try {
      const redux = window.pga?.helpers?.getReduxValue?.();
      if (redux?.storage?.selectedItem !== undefined) {
        const item = redux.storage.selectedItem;
        return item.id;
      }
    } catch (e) {
      // Redux chưa attach -> chờ thêm
    }
    await new Promise(r => setTimeout(r, 200)); // đợi 0.2s rồi thử lại
  }
  console.warn("⚠️ Redux chưa sẵn sàng sau 2s");
}
async function auto_turn_on() {
  if (window.auto !== 'on') return;

  const itemId = await safeCheckHeldItem();
  if (itemId?.startsWith("itm_pickaxe_")) {
    autoMineZeroDelayUltraPro_v4();
  } else {
    //console.log("⛏️ Không phải pickaxe hoặc Redux chưa load:", itemId);
  }
}
let lastCollectTime = 0; // thời gian gọi cuối (ms)

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
    waitForOnGameEvent(() => {
        window.onGameEvent("PLAYER_JOINED", stop_auto);
        window.onGameEvent("PLAYER_PET_UPDATE", safeCollectReadyStations);
        window.onGameEvent("RELEASE_FROM_CURSOR", auto_turn_on);
    })
    /************ ⌨️ PHÍM TẮT ************/
    document.addEventListener("keydown", e => {
        if (e.code === "Delete") clickAllCropsSmart(); // Bắt đầu auto
        if (e.code === "PageUp") autoMineZeroDelayUltraPro_v4(); // Bắt đầu auto
        if (e.code === "PageDown") autoChopTreesVerticalProgressiveFast(); // Bắt đầu auto
        if (e.code === "Space") {STOP_AUTO = true; STOP_AUTOMINE = true;drawAutoStatus(false);};// Dừng khẩn cấp
    });
})();

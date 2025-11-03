// ==UserScript==
// @name         Highlight Mine Timer Only
// @namespace    https://pixels.xyz/
// @version      1.0
// @description  Highlight mines with countdown and visual indicators (only). No UGC or chat bubble.
// @author       Drayke
// @match        *://play.pixels.xyz/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let blur = 0;
 let  offsettime = Number(localStorage.getItem('offsettime') )|| 0;
  function getRemainingTimeInSeconds(endTimestamp) {
    const now = Date.now() + offsettime;
    return (endTimestamp - now) / 1000;
  }
    function create_ui_setting(){
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (
                        node.nodeType === 1 &&
                        node.classList.contains("SettingsWindow_container__n49mI")
                    ) {
                        setTimeout(() => insertOffsetUI(node), 30);
                    }
                });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

    }

    function insertOffsetUI(container) {
        const box = container.querySelector(".SettingsWindow_box__j8FBV");
        const closeBtn = container.querySelector(".commons_closeBtn__UobaL");
        if (!box || !closeBtn) {
            console.warn("Box hoặc CloseBtn chưa sẵn sàng");
            return;
        }
        if (box.querySelector("#offset-input")) return;
        const settingDiv = document.createElement("div");
        settingDiv.className = "SettingsWindow_setting__Rqjlp"
        const label = document.createElement("label");
        label.textContent = "Offset Time (ms): ";
        label.style.marginRight = "8px";
        const input = document.createElement("input");
        input.type = "number";
        input.id = "offset-input";
        input.value = localStorage.getItem("offsettime") || "0";
        input.style.width = "100px";
        input.style.marginRight = "8px";
        ["keydown", "keyup", "keypress"].forEach((eventName) => {
            input.addEventListener(eventName, (e) => e.stopPropagation());
        });

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.className = "commons_pushbutton__7Tpa3 commons_desktoponly__8Rp82";
        saveBtn.onclick = () => {
            localStorage.setItem("offsettime", input.value);
            offsettime = Number(input.value); // ← Cập nhật lại biến
            alert("Offset saved: " + input.value + " ms");
        };

        settingDiv.appendChild(label);
        settingDiv.appendChild(input);
        settingDiv.appendChild(saveBtn);
        closeBtn.parentElement?.insertBefore(settingDiv, closeBtn.nextSibling);
    }
  function getRemainingTimeString(totalInSeconds, mine = false) {
    if (totalInSeconds <= 0) return mine ? "ready" : "available";
    const days = Math.floor(totalInSeconds / (60 * 60 * 24));
    if (days > 0) return `${days} ${days > 1 ? "days" : "day"}`;
    const hours = Math.floor(totalInSeconds / 3600);
    const minutes = Math.floor((totalInSeconds % 3600) / 60);
    const seconds = Math.floor(totalInSeconds % 60);
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}`;
    if (minutes > 0) return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    return `${seconds}s`;
  }

  function getNumberTrackerByName(e, name) {
    if (Array.isArray(e.generic.trackers)) {
      const stat = e.generic.trackers.find((s) => s.name === name);
      if (stat && stat.numeric) return Number(stat.value);
    }
    return -1;
  }

  function drawTextWithBG(ctx, txt, font, x, y) {
    ctx.save();
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const paddingX = 20;
    const paddingY = 15;

    const metrics = ctx.measureText(txt);
    const textWidth = metrics.width;
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      x - textWidth / 2 - paddingX,
      y - textHeight / 2 - paddingY,
      textWidth + paddingX * 2,
      textHeight + paddingY * 2
    );

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeText(txt, x, y);

    ctx.fillStyle = "red";
    ctx.fillText(txt, x, y);

    ctx.restore();
  }
function drawAnimatedFlagAt(ctx, drawX, drawY) {
  const SPRITE_WIDTH = 122;
  const SPRITE_HEIGHT = 200;
  const TOTAL_FRAMES = 7;
  const FRAME_DURATION_MS = 1000 / 6;
  const POLE_WIDTH = 30;
  const FLAG_WIDTH = SPRITE_WIDTH - POLE_WIDTH;
  const PHYSICS_OFFSET_Y = 160;

  if (!window.flagSprite) {
    const img = new Image();
    img.src = "https://mesh-online-assets.s3.us-east-2.amazonaws.com/uploadedAssets/ugc/objects/obj_ugc-vietnamese-red-flag-iogv6tNY.png";
    window.flagSprite = img;
    return; // đợi load ảnh rồi render lại sau
  }

  if (!window.flagSprite.complete) return;

  // Vẽ cột đứng yên
  ctx.drawImage(
    window.flagSprite,
    0, 0,
    POLE_WIDTH, SPRITE_HEIGHT,
    drawX, drawY,
    POLE_WIDTH, SPRITE_HEIGHT
  );

  // Vẽ lá cờ động
  const frameIndex = Math.floor(Date.now() / FRAME_DURATION_MS) % TOTAL_FRAMES;
  const srcX = frameIndex * SPRITE_WIDTH + POLE_WIDTH;

  ctx.drawImage(
    window.flagSprite,
    srcX, 0,
    FLAG_WIDTH, SPRITE_HEIGHT,
    drawX + POLE_WIDTH, drawY,
    FLAG_WIDTH, SPRITE_HEIGHT
  );
}
  function drawCircleOver(screenX, screenY, screenWidth, screenHeight, color, shadowColor, blur2, timerString, highlight) {
    const ctx = window.pga.drawing.canvasContext;
    ctx.save();

    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = blur2;

    if (highlight === true) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(screenX + screenWidth / 2, screenY + screenHeight / 2, screenWidth / 2, 0, Math.PI * 3);
    ctx.fill();
  } else if (highlight === "me") {
    drawAnimatedFlagAt(ctx, (screenX + screenWidth / 2) - 20, (screenY + screenHeight / 2) - 200);
  }

    let font = "bold 25px Arial";
    if (window.pga.store.ui.isMiniMap) font = "bold 20px Arial";

    drawTextWithBG(ctx, timerString, font, screenX + screenWidth / 2, screenY + screenHeight / 2);
    ctx.restore();
  }

  function clearCanvas() {
    const ctx = window.pga.drawing.canvasContext;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  function highlightMines(events) {
    const pga2 = window.pga;
    const ctx = pga2.drawing.canvasContext;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const roomScene = pga2.helpers.getRoomScene();
    if (!roomScene) return;

    for (let i = 0; i < events.length; i++) {
      const points = pga2.helpers.getDetailsOfEntities([events[i].mid]);
      if (!points || points.length === 0) continue;

      const { x, y, width, height } = points[0];
      const finishTime = events[i]?.generic?.displayInfo?.utcTarget;

      if (finishTime !== undefined) {
        const remainingTimeInSecond = getRemainingTimeInSeconds(finishTime);
        let timerString = getRemainingTimeString(remainingTimeInSecond, false);

        const {
          x: screenX,
          y: screenY,
          width: screenWidth,
          height: screenHeight,
        } = pga2.helpers.getScreenCoords(roomScene, x, y, width, height);

        let shadowColor = "rgba(255, 0, 0, 0.7)";
        let highlight = false;
        const color = "rgba(0, 130, 0, 0.5)";

        if (remainingTimeInSecond < 0) {
          shadowColor = "rgba(0, 255, 0, 0.7)";
          highlight = true;
        }

        if (getNumberTrackerByName(events[i], "inUseByMe") === 1) {
          shadowColor = "rgba(0, 0, 255, 0.7)";
             highlight = "me";
        }

        if (events[i].generic?.displayInfo?.format?.startsWith("Collect")) {
          shadowColor = "rgba(0, 0, 255, 0.7)";
             highlight = "me";
          timerString = getRemainingTimeString(remainingTimeInSecond, true);
        }

        drawCircleOver(screenX, screenY, screenWidth, screenHeight, color, shadowColor, blur, timerString, highlight);
      }
    }
  }
    let lastPlayerList = [];
function safeRenderPlayerList() {
  const currentUsername = window.pga.helpers.getRoomScene().selfPlayer.username;
  const players = window.pga.helpers.getRoomScene().stateManager.players;

  // lọc bỏ guest và chính mình
  const realPlayers = [];
  players.forEach(p => {
    if (!p.username.startsWith("Guest") && p.username !== currentUsername) {
      realPlayers.push(p.username);
    }
  });

  // chỉ render nếu có thay đổi
  if (JSON.stringify(realPlayers) === JSON.stringify(lastPlayerList)) {
    return;
  }
  lastPlayerList = realPlayers;

 renderPlayerList(realPlayers);
}

function renderPlayerList(playerList) {
  let wrapper = document.getElementById('player-list');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.id = 'player-list';
    wrapper.style.position = 'fixed';
    wrapper.style.left = '10px';
    wrapper.style.bottom = '50%';
    wrapper.style.transform = 'translateY(50%)';
    wrapper.style.background = 'rgba(0,0,0,0.85)';
    wrapper.style.color = '#fff';
    wrapper.style.padding = '10px';
    wrapper.style.borderRadius = '8px';
    wrapper.style.fontFamily = 'Arial, sans-serif';
    wrapper.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
    wrapper.style.zIndex = '9999';

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    wrapper.appendChild(table);
    document.body.appendChild(wrapper);
  }

  const table = wrapper.querySelector('table');
  table.innerHTML = '';

  // header: tổng số player thực
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('td');
  headerCell.textContent = `👷 (${playerList.length})`;
  headerCell.style.fontWeight = 'bold';
  headerCell.style.padding = '4px 8px';
  headerRow.appendChild(headerCell);
  table.appendChild(headerRow);

  // render danh sách
  playerList.forEach(username => {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.textContent = username;
    cell.style.padding = '4px 8px';
    row.appendChild(cell);
    table.appendChild(row);
  });
}

function clearPlayerList() {
  const wrapper = document.getElementById('player-list');
  if (wrapper) wrapper.remove();
}

  function waitForPGAHelpers(callback) {
    const interval = setInterval(() => {
      if (
        window.pga &&
        window.pga.helpers &&
        window.pga.helpers.getRoomScene &&
        window.pga.helpers.getRoomScene()?.selfPlayer
      ) {
        clearInterval(interval);
        callback();
      }
    }, 100);
  }

    function drawCircleFollowPlayer(radius = 300, color = "rgba(255,0,0,0.6)", lineWidth = 3) {
        const room = window.pga?.helpers?.getRoomScene?.();
        const ctx = window.pga?.drawing?.canvasContext;
        const cam = room?.cameras?.main;
        if (!room || !ctx || !cam) return;

        const self = room.selfPlayer;
        if (!self?.position) return;

        const { x: worldX, y: worldY } = self.position;

        const screen = window.pga.helpers.getScreenCoords(room, worldX, worldY, 64, 64);
        const centerX = screen.x + screen.width / 2;
        const centerY = screen.y + screen.height / 2;

        ctx.save();
        ctx.shadowColor = "rgba(255,0,0,0.8)";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * cam.zoom, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

  waitForPGAHelpers(() => {
create_ui_setting();
    setInterval(() => {
      const entities = window.pga?.store?.ui?.mineEntitiesForHighlighting;
      const mapId = window.pga?.helpers.getReduxValue()?.game?.room?.mapId;
      if (Array.isArray(entities) && entities.length || 0 && mapId?.startsWith("pixelsNFTFarm") && window.minebutton) {

          highlightMines(entities);
          drawCircleFollowPlayer(300)
      } else {
        clearCanvas();
      }
    }, 1000 / 30); // khoảng 30 FPS
  });



})();

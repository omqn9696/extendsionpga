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

    })

function handleRoomLoaded(data2 = null) {
  const room = window.pga.helpers.getRoomScene();
  if (room) {
    room.stateManager.room.onMessageHandlers.events["*"].push(handleRoomEvents);
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
}


})();

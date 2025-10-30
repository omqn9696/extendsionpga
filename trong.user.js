// ==UserScript==
// @name         Click AUTO CHE
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Auto click chế by OMDEPTRAI
// @match        https://play.pixels.xyz/
// @icon         https://play.pixels.xyz/favicon/favicon.ico
// @grant        none
// ==/UserScript==

(() => {
    "use strict";
// window.CraftingAuto.enabled = false;
    const SAVE_KEY = "crafting_saved_item";
    const ICON_KEY = "crafting_saved_icon"; // lưu url icon

    const SELECTORS = {
        rightTitle: ".Crafting_rightPage__63TP1 .Crafting_craftingFontText__EeNSQ",
        recipeList: ".Crafting_craftingRecipeItem__vnhBH",
        createBtn: ".Crafting_rightPage__63TP1 .Crafting_craftingButton__Qd6Ke",
        titleBox: ".Crafting_detailsTitle__bGjKU",
        infoBtn: ".info-button",
        speedupBox: ".Speedup_buttons__7X1WE",
        closeBtn: ".Crafting_craftingCloseButton__ZbHQF",
        itemImage: ".Crafting_itemImageWrapper__i_O5l.Crafting_scalehalf__WNWH5 img"
    };

    window.CraftingAuto = {
        enabled: false,
        getSaved: () => localStorage.getItem(SAVE_KEY),
        setSaved: (name, icon) => {
            localStorage.setItem(SAVE_KEY, name);
            localStorage.setItem(ICON_KEY, icon || "");
        },
        getIcon: () => localStorage.getItem(ICON_KEY),
        toggle: () => {
            window.CraftingAuto.enabled = !window.CraftingAuto.enabled;
            //console.log("[AutoCraft] trạng thái:", window.CraftingAuto.enabled ? "ON" : "OFF");
            updateFloatingButton();
        }
    };

    const simulateClick = (el) => el && ["pointerdown","mousedown","mouseup","pointerup","click"]
        .forEach(type => el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true })));

    const currentRightItem = () =>
        document.querySelector(SELECTORS.rightTitle)?.textContent.trim();

    function ensureCraft() {
        if (!window.CraftingAuto.enabled) return;

        const name = window.CraftingAuto.getSaved();
        if (!name) return;

        if (currentRightItem() !== name) {
            const listItem = [...document.querySelectorAll(SELECTORS.recipeList)]
                .find(el => el.textContent.includes(name));
            if (listItem) {
                //console.log("[AutoCraft] chọn item:", name);
                simulateClick(listItem);
            }
        } else {
            const btn = document.querySelector(SELECTORS.createBtn);
            if (btn && !btn.disabled) {
                //console.log("[AutoCraft] click Create cho:", name);
                simulateClick(btn);
                setTimeout(checkAndCloseSpeedup, 500);
            }
        }
    }

    function checkAndCloseSpeedup() {
        const speedupBox = document.querySelector(SELECTORS.speedupBox);
        if (speedupBox) {
            const closeBtn = document.querySelector(SELECTORS.closeBtn);
            if (closeBtn) {
                //console.log("[AutoCraft] thấy speedup → đóng popup");
                simulateClick(closeBtn);
            }
        }
    }

    function addSaveButtons() {
        document.querySelectorAll(SELECTORS.titleBox).forEach(titleBox => {
            if (titleBox.querySelector(".save-button")) return;

            const infoBtn = titleBox.querySelector(SELECTORS.infoBtn);
            if (!infoBtn) return;

            const saveBtn = document.createElement("img");
            Object.assign(saveBtn, {
                src: "https://img.icons8.com/?size=80&id=81932&format=png",
                className: "save-button",
                title: "Save item để auto craft"
            });
            Object.assign(saveBtn.style, {
                marginLeft: "10px",
                cursor: "pointer",
                width: "30px",
                height: "30px"
            });

saveBtn.addEventListener("click", () => {
    const itemName = titleBox.querySelector(".Crafting_craftingFontText__EeNSQ")?.textContent.trim();
    const itemImgEl = document.querySelector(".Crafting_rightPage__63TP1 .Crafting_itemImageWrapper__i_O5l.Crafting_scalehalf__WNWH5 img");
    const itemIcon = itemImgEl ? itemImgEl.src.startsWith("http") ? itemImgEl.src : window.location.protocol + itemImgEl.src : "";

    if (!itemName) return;
    window.CraftingAuto.setSaved(itemName, itemIcon);

   // console.log("[AutoCraft] đã lưu:", itemName, "icon:", itemIcon);
    alert("Đã lưu item: " + itemName);

    document.querySelectorAll(".save-button").forEach(btn => {
        btn.style.border = "none";
    });
    saveBtn.style.border = "2px solid #4caf50";
    saveBtn.style.borderRadius = "6px";

    updateFloatingButton();
});

            infoBtn.insertAdjacentElement("afterend", saveBtn);
        });
    }

    function addFloatingButton() {
        if (document.getElementById("autoCraftFloatingBtn")) return;

        const btn = document.createElement("button");
        btn.id = "autoCraftFloatingBtn";
        btn.title = "Toggle AutoCraft";

        Object.assign(btn.style, {
            position: "fixed",
            top: "71%",
            right: "0px",
            transform: "translateY(-50%)",
            border: "none",
            borderRadius: "4px 0px 0px 4px",
            boxShadow: "rgba(0, 0, 0, 0.3) 0px 6px 6px",
            cursor: "pointer",
            zIndex: "3000",
            width: "60px",
            height: "60px",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center center",
            backgroundSize: "32px 32px",
            color: "transparent",
            backgroundColor: "lightyellow",
            transition: "background-color 0.3s, box-shadow 0.3s"
        });

        btn.addEventListener("click", () => {
            window.CraftingAuto.toggle();
        });

        document.body.appendChild(btn);
        updateFloatingButton();
    }
async function collectReadyStations() {
  const room = window.pga?.helpers?.getRoomScene?.();
  if (!room?.entities) return;

  const ready = [...room.entities.values()].filter(e => {
    if (!e) return false;
    const id = e?.gameEntity?.id || "";
    return (
      (e.state === "ready" || e.state === "wood" || e.state === "default") &&
      !id.toLowerCase().includes("portal")
    );
  });

  for (const ent of ready) {
    ent.clicked(makePointerForEntity(ent), {});
    await new Promise(r => setTimeout(r, 150 + Math.random() * 80));
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
    function updateFloatingButton() {
        const btn = document.getElementById("autoCraftFloatingBtn");
        if (!btn) return;

        const icon = window.CraftingAuto.getIcon();
        btn.style.backgroundImage = icon && icon.length > 0
            ? `url(${icon})`
            : "url(https://img.icons8.com/?size=48&id=118619&format=png)"; // icon dấu hỏi

        if (window.CraftingAuto.enabled) {
            btn.style.backgroundColor = "rgb(22, 163, 74)";
            btn.style.boxShadow = "0 0 12px rgba(22, 163, 74, 0.8)";
        } else {
            btn.style.backgroundColor = "lightyellow";
            btn.style.boxShadow = "rgba(0, 0, 0, 0.3) 0px 6px 6px";
        }
    }

    new MutationObserver(() => {
        addSaveButtons();
        if (window.CraftingAuto.enabled) ensureCraft();
    }).observe(document.body, { childList: true, subtree: true });
document.addEventListener("keydown", (e) => {

    if (e.code === "KeyM") {
      collectReadyStations();
    }
  });
    setTimeout(() => {
        addSaveButtons();
        addFloatingButton();
        if (window.CraftingAuto.enabled) ensureCraft();
    }, 1000);
})();

// ==UserScript==
// @name         Click AUTO CHE (Full Kit Selector)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Auto craft + collect + kit selector by OMDEPTRAI
// @match        https://play.pixels.xyz/*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const SAVE_KEY = "crafting_saved_item";
  const ICON_KEY = "crafting_saved_icon";

  const SELECTORS = {
    rightTitle: ".Crafting_rightPage__63TP1 .Crafting_craftingFontText__EeNSQ",
    recipeList: ".Crafting_craftingRecipeItem__vnhBH",
    createBtn: ".Crafting_rightPage__63TP1 .Crafting_craftingButton__Qd6Ke",
    titleBox: ".Crafting_detailsTitle__bGjKU",
    infoBtn: ".info-button",
    closeBtn: ".Crafting_craftingCloseButton__ZbHQF",
  };

  /*********** ⚙️ STATE ***********/
  window.CraftingAuto = {
    enabled: false,
    kit: "ent_stove_",
    getSaved: () => localStorage.getItem(SAVE_KEY),
    getIcon: () => localStorage.getItem(ICON_KEY),
    setSaved: (name, icon) => {
      localStorage.setItem(SAVE_KEY, name);
      localStorage.setItem(ICON_KEY, icon || "");
    },
    toggle() {
      this.enabled = !this.enabled;
      updateFloatingButton();
    },
  };

  /*********** 🖱️ SIMULATE ***********/
  function simulateClick(el) {
    if (!el) return;
    el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true }));
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

  /*********** 🧱 AUTO CRAFT ***********/
  async function autoCraftAllLoaded(namecraft, kitPrefix) {
    const room = window.pga?.helpers?.getRoomScene?.();
    if (!room?.entities) return console.warn("❌ Không tìm thấy room.entities");

    const workstations = [...room.entities.values()].filter(
      e => e?.gameEntity?.id?.startsWith(kitPrefix) &&
        (e?.currentState?.state === "loaded" ||
         e?.generic?.state === "loaded" ||
         e?.state === "loaded")
    );
    if (!workstations.length) return;

    for (const workstation of workstations) {
      try {
        workstation.clicked(makePointerForEntity(workstation), {});
        await new Promise(r => setTimeout(r, 1300 + Math.random() * 300));

        const recipes = [...document.querySelectorAll(".Crafting_craftingFontText__EeNSQ.clickable")];
        const recipe = recipes.find(el => el.textContent.trim().toLowerCase() === namecraft.trim().toLowerCase());
        if (!recipe) continue;

        recipe.click();
        await new Promise(r => setTimeout(r, 600 + Math.random() * 200));

        const craftBtn = document.querySelector(".Crafting_craftingButton__Qd6Ke");
        if (craftBtn) craftBtn.click();

        setTimeout(() => {
          document.querySelector(SELECTORS.closeBtn)?.click();
        }, 800);
        await new Promise(r => setTimeout(r, 800 + Math.random() * 300));
      } catch (err) {
        console.warn("⚠️ Lỗi:", err);
      }
    }
  }

  /*********** 🧭 AUTO COLLECT ***********/
  async function collectReadyStations() {
    const room = window.pga?.helpers?.getRoomScene?.();
    if (!room?.entities) return;

    const ready = [...room.entities.values()].filter(
      e => e?.currentState?.state === "ready" ||
           e?.state === "ready" ||
           e?.generic?.state === "ready"
    );

    for (const ent of ready) {
      ent.clicked(makePointerForEntity(ent), {});
      await new Promise(r => setTimeout(r, 250 + Math.random() * 150));
    }
  }

  /*********** 💾 SAVE BUTTON ***********/
  function addSaveButtons() {
    document.querySelectorAll(SELECTORS.titleBox).forEach(titleBox => {
      if (titleBox.querySelector(".save-button")) return;

      const infoBtn = titleBox.querySelector(SELECTORS.infoBtn);
      if (!infoBtn) return;

      const saveBtn = document.createElement("img");
      Object.assign(saveBtn, {
        src: "https://img.icons8.com/?size=80&id=81932&format=png",
        className: "save-button",
        title: "Save item để auto craft",
      });
      Object.assign(saveBtn.style, {
        marginLeft: "10px",
        cursor: "pointer",
        width: "30px",
        height: "30px",
      });

      saveBtn.addEventListener("click", () => {
        const itemName = titleBox.querySelector(".Crafting_craftingFontText__EeNSQ")?.textContent.trim();
        const img = document.querySelector(".Crafting_itemImageWrapper__i_O5l img")?.src || "";
        if (!itemName) return;
        window.CraftingAuto.setSaved(itemName, img);
        alert("✅ Đã lưu item: " + itemName);
        updateFloatingButton();
      });

      infoBtn.insertAdjacentElement("afterend", saveBtn);
    });
  }

  /*********** 🔘 FLOAT BUTTONS ***********/
  function addFloatingButton() {
    if (document.getElementById("autoCraftFloatingBtn")) return;

    const btn = document.createElement("button");
    btn.id = "autoCraftFloatingBtn";
    btn.title = "Toggle AutoCraft";
    Object.assign(btn.style, {
      position: "fixed",
      top: "70%",
      right: "0px",
      transform: "translateY(-50%)",
      border: "none",
      borderRadius: "4px 0 0 4px",
      cursor: "pointer",
      zIndex: 3000,
      width: "48px",
      height: "48px",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "32px 32px",
      transition: "0.3s",
    });

    btn.addEventListener("click", () => window.CraftingAuto.toggle());
    document.body.appendChild(btn);
    updateFloatingButton();
  }

  function updateFloatingButton() {
    const btn = document.getElementById("autoCraftFloatingBtn");
    if (!btn) return;
    const icon = window.CraftingAuto.getIcon();
    btn.style.backgroundImage = icon ? `url(${icon})` : "url(https://img.icons8.com/?size=48&id=118619&format=png)";
    if (window.CraftingAuto.enabled) {
      btn.style.backgroundColor = "#16a34a";
      btn.style.boxShadow = "0 0 12px rgba(22,163,74,0.8)";
    } else {
      btn.style.backgroundColor = "lightyellow";
      btn.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)";
    }
  }

  /*********** 🧰 KIT SELECTOR BUTTON ***********/
  function addKitSelector() {
    const kitBtn = document.createElement("button");
    kitBtn.id = "kitSelectFloatingBtn";
    kitBtn.title = "Chọn loại Kit";
    Object.assign(kitBtn.style, {
      position: "fixed",
      top: "calc(70% + 60px)",
      right: "0px",
      transform: "translateY(-50%)",
      border: "none",
      borderRadius: "4px 0 0 4px",
      boxShadow: "rgba(234,179,8,0.8) 0 0 12px",
      cursor: "pointer",
      zIndex: 3000,
      width: "48px",
      height: "48px",
      backgroundColor: "#eab308",
      backgroundImage: "url('https://cdn-icons-png.flaticon.com/512/685/685655.png')",
      backgroundSize: "28px 28px",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    });

    const menu = document.createElement("div");
    Object.assign(menu.style, {
      position: "fixed",
      right: "55px",
      top: "calc(70% + 60px)",
      transform: "translateY(-50%)",
      background: "rgba(30,30,30,0.9)",
      color: "white",
      borderRadius: "8px",
      padding: "8px 10px",
      display: "none",
      flexDirection: "column",
      gap: "6px",
      zIndex: 3001,
      boxShadow: "0 0 10px rgba(0,0,0,0.5)",
      fontSize: "13px",
      minWidth: "130px",
    });

    const kits = [
      { name: "🔥 Stove", id: "ent_stove_" },
      { name: "⚙️ Metalworking", id: "ent_metalworking_" },
      { name: "🪵 Woodworking", id: "ent_woodworking_" },
      { name: "🏺 Kiln", id: "ent_kiln_" },
    ];

    kits.forEach(k => {
      const opt = document.createElement("button");
      opt.textContent = k.name;
      Object.assign(opt.style, {
        background: "transparent",
        color: "white",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "4px",
        padding: "4px 8px",
        textAlign: "left",
        cursor: "pointer",
      });
      opt.onmouseenter = () => (opt.style.background = "rgba(255,255,255,0.1)");
      opt.onmouseleave = () => (opt.style.background = "transparent");
      opt.onclick = () => {
        menu.style.display = "none";
        window.CraftingAuto.kit = k.id;
        alert("🧩 Kit đã chọn: " + k.name);
      };
      menu.appendChild(opt);
    });

    kitBtn.addEventListener("click", () => {
      menu.style.display = menu.style.display === "none" ? "flex" : "none";
    });

    document.addEventListener("click", (e) => {
      if (!kitBtn.contains(e.target) && !menu.contains(e.target)) menu.style.display = "none";
    });

    document.body.appendChild(kitBtn);
    document.body.appendChild(menu);
  }

  /*********** ⌨️ HOTKEYS ***********/
  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyC" && window.CraftingAuto.enabled) {
      autoCraftAllLoaded(window.CraftingAuto.getSaved(), window.CraftingAuto.kit);
    }
    if (e.code === "KeyM" && window.CraftingAuto.enabled) {
      collectReadyStations();
    }
  });

  /*********** 👀 OBSERVER ***********/
  new MutationObserver(() => addSaveButtons()).observe(document.body, { childList: true, subtree: true });
  setTimeout(() => {
    addSaveButtons();
    addFloatingButton();
    addKitSelector();
  }, 1500);

})();

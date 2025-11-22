// ==UserScript==
// @name         Hỗ trợ Đào Bằng Tay Pixels game (Orion iOS Optimized)
// @namespace    http://tampermonkey.net/
// @icon         https://play.pixels.xyz/favicon/favicon.ico
// @version      4.2
// @description  Support Mine (iOS Orion Stable Version)
// @match        *://play.pixels.xyz/*
// @grant        unsafeWindow
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js
// ==/UserScript==

(function() {
    'use strict';
(function () {
    const W = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

    // Tạo box log
    const logBox = document.createElement("div");
    Object.assign(logBox.style, {
        position: "fixed",
        bottom: "0px",
        left: "0px",
        width: "100%",
        maxHeight: "180px",
        overflowY: "auto",
        background: "rgba(0,0,0,0.75)",
        color: "#0f0",
        fontSize: "12px",
        padding: "6px",
        zIndex: 999999,
        fontFamily: "monospace",
        display: "none",
        borderTop: "1px solid #444"
    });
    logBox.id = "tm-debug-console";
    document.body.appendChild(logBox);

    // Nút toggle console
    const toggleBtn = document.createElement("button");
    toggleBtn.innerText = "LOG";
    Object.assign(toggleBtn.style, {
        position: "fixed",
        bottom: "185px",
        left: "10px",
        zIndex: 999999,
        padding: "5px 10px",
        background: "#222",
        color: "#0f0",
        border: "1px solid #0f0",
        borderRadius: "4px",
        fontSize: "14px"
    });
    document.body.appendChild(toggleBtn);

    toggleBtn.onclick = () => {
        logBox.style.display = (logBox.style.display === "none" ? "block" : "none");
    };

    // Hook console.log
    const rawLog = console.log;
    console.log = function (...msg) {
        rawLog.apply(console, msg);
        const line = document.createElement("div");
        line.textContent = "[LOG] " + msg.map(x => typeof x === "object" ? JSON.stringify(x) : x).join(" ");
        logBox.appendChild(line);
        logBox.scrollTop = logBox.scrollHeight;
    };

    // Hook console.error
    const rawErr = console.error;
    console.error = function (...msg) {
        rawErr.apply(console, msg);
        const line = document.createElement("div");
        line.style.color = "#ff4444";
        line.textContent = "[ERROR] " + msg.map(x => typeof x === "object" ? JSON.stringify(x) : x).join(" ");
        logBox.appendChild(line);
        logBox.scrollTop = logBox.scrollHeight;
    };
})();
    /*******************************
     * 1) Chuẩn hóa window
     *******************************/
    const W = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

    W.mine_tiger = 4;
    W.farm_type  = "mine";
    W.minebutton = false;


    /*******************************
     * 2) CSS ổn định cho iOS
     *******************************/
    GM_addStyle(`
        .buttonland {
            background:#007bff;color:#fff;border:none;padding:4px 8px;border-radius:4px;
            cursor:pointer;width:100%;transition:.2s;
        }
        div#landTableContainer table td { font-size:1.5em; }
        .Profile_playersWindow__oaElk.overlay_overlayWindow__c8gaU.is-active {
            left:10px !important; top:30% !important;
        }
        canvas#voxels-canvas { display:none !important; }
        #voxels-main-nav { bottom:60% !important; }
    `);

    /*******************************
     * 3) Load whitelist TREE LAND từ webhook
     *******************************/
    window.addEventListener("load", () => {
        fetch("https://n8n.exquisitefly.net/webhook/landtree")
            .then(r => r.json())
            .then(d => {
                if (d.land) {
                    W.id_tree_land = d.land
                        .filter(x => x && !isNaN(x))
                        .map(x => parseInt(x));
                }
            })
            .catch(e => console.log("Webhook error:", e));
    });


    /*******************************
     * 4) TẠO UI CHÍNH (Mine Buttons)
     *******************************/
    function createToggleUI() {
        if (document.querySelector("#minebtn")) return;

        const box = document.createElement("div");
        box.id = "minebtn";
        Object.assign(box.style, {
            position: "absolute", bottom:"0", right:"0",
            background:"transparent", color:"white",
            padding:"12px 16px", borderRadius:"8px",
            width:"220px", zIndex:"9999",
            transition:"width .3s ease"
        });

        box.innerHTML = `
            <style>
             #blacklistButton,
             .icon-button {
                display:flex;width:40px;height:40px;margin:0 auto 8px;border:none;
                background-repeat:no-repeat;background-size:contain;background-color:transparent;
                cursor:pointer;border-radius:6px;
             }
             .icon-button.on { background-color:#16a34a }
             .icon-button.off { background-color:unset }
             #toggleFeatureOne { background-image:url('https://assets.pixels.tips/images/industries/mine.webp'); }
             #toggleFeatureTwo { background-image:url('https://d31ss916pli4td.cloudfront.net/uploadedAssets/o/obj_pixelsdungeon_pick/f9fca235-1f6e-4c2e-8fa9-5e1c59bb21b0.png'); }
             #blacklistButton { background-image:url(https://d31ss916pli4td.cloudfront.net/uploadedAssets/o/obj_witch_book_holder/8e0b55c9-71dc-401f-a062-84c0db04842c.png); }
            </style>

            <button id="toggleFeatureOne" class="icon-button off"></button>
            <button id="toggleFeatureTwo" class="icon-button off"></button>
            <button id="farmtype" class="icon-button off"></button>
            <button id="blacklistButton" class="icon-button off"></button>

            <div id="landTableContainer"
                 style="margin-top:12px;max-height:700px;overflow-y:auto;width:500px"></div>
        `;
        document.body.appendChild(box);

        // Keyboard toggle
        document.addEventListener("keydown", e => {
            if (e.key.toLowerCase() === "e") {
                box.style.width = (box.style.width === "0px" ? "220px" : "0px");
            }
        });

        setupButtons();
    }


    /*******************************
     * 5) Xử lý sự kiện từng button
     *******************************/
    let featureOneEnabled = false;
    let featureTwoEnabled = false;

    function setupButtons() {
        const toggleOne = document.querySelector("#toggleFeatureOne");
        const toggleTwo = document.querySelector("#toggleFeatureTwo");
        const farmBtn   = document.querySelector("#farmtype");

        // Toggle nhận
        toggleOne.addEventListener("click", () => {
            featureOneEnabled = !featureOneEnabled;
            if (featureOneEnabled) {
                featureTwoEnabled = false;
                toggleTwo.classList.remove("on");
                toggleTwo.classList.add("off");
            }
            toggleOne.classList.toggle("on", featureOneEnabled);
            toggleOne.classList.toggle("off", !featureOneEnabled);
        });

        // Toggle đào
        toggleTwo.addEventListener("click", () => {
            featureTwoEnabled = !featureTwoEnabled;
            if (featureTwoEnabled) {
                featureOneEnabled = false;
                toggleOne.classList.remove("on");
                toggleOne.classList.add("off");
            }
            toggleTwo.classList.toggle("on", featureTwoEnabled);
            toggleTwo.classList.toggle("off", !featureTwoEnabled);

            W.minebutton = featureTwoEnabled;
        });

        // Toggle farm type
        farmBtn.style.backgroundImage = "url(https://d31ss916pli4td.cloudfront.net/game/ui/skills/skills_icon_mining.png?v2)";
        farmBtn.addEventListener("click", () => {
            if (W.farm_type === "mine") {
                W.farm_type = "tree";
                farmBtn.style.backgroundImage = "url(https://d31ss916pli4td.cloudfront.net/game/ui/skills/skills_icon_forestry.png?v2)";
            } else {
                W.farm_type = "mine";
                farmBtn.style.backgroundImage = "url(https://d31ss916pli4td.cloudfront.net/game/ui/skills/skills_icon_mining.png?v2)";
            }
        });
    }


    /*******************************
     * 6) Observer duy nhất (ổn định iOS)
     *******************************/
    const observer = new MutationObserver(() => {
        if (!document.querySelector("#minebtn")) createToggleUI();
    });

    observer.observe(document.body, { childList:true, subtree:true });


    /*******************************
     * 7) Đảm bảo UI load chậm phù hợp iOS
     *******************************/
    setTimeout(createToggleUI, 1000);
    requestAnimationFrame(createToggleUI);

})();

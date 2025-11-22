// ==UserScript==
// @name         Hỗ trợ Đào Bằng Tay Pixels game
// @namespace    http://tampermonkey.net/
// @icon         https://play.pixels.xyz/favicon/favicon.ico
// @version      4.0
// @description  Support Mine
// @author       GAOOM.AI
// @match        *://play.pixels.xyz/*
// @grant        unsafeWindow
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js



// ==/UserScript==
(function() {
    'use strict';
GM_addStyle(`
 .buttonland{background: #007bff;color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; width: 100%; transition: transform 0.2s ease, background-color 0.3s ease, box-shadow 0.2s ease;}.LandAndTravel_content__b_dal table td{    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;}div#landTableContainer table td {
    font-size: 1.5em;
}div#landTableContainer table tr td button:hover {
    background: #5ff600 !important;
}.Profile_playersWindow__oaElk.overlay_overlayWindow__c8gaU.is-active {
    left: 10px !important;
    top: 30% !important;
}canvas#voxels-canvas {
    display: none !important;
}
#voxels-main-nav {
bottom:60%!important;
}
`);
fetch("https://n8n.exquisitefly.net/webhook/landtree")
  .then(res => res.json())
  .then(data => {
    if (data.land) {
      // Lọc bỏ khoảng trống + ép kiểu số cho chắc
      unsafeWindow.id_tree_land = data.land
        .filter(id => id !== null && id !== undefined && id !== "" && !isNaN(id))
        .map(id => parseInt(id, 10));
    }
  })
  .catch(err => console.error("Lỗi khi gọi webhook:", err));
    unsafeWindow.mine_tiger = 4;
 unsafeWindow.farm_type = "mine";
    const STORAGE_KEY = 'backlistLand';
    let container = null;
unsafeWindow.minebutton = false;
    // Tạo giao diện bảng
    function createBlacklistUI() {
        container = document.createElement('div');
        container.id = 'backlistContainer';
        container.style.position = 'fixed';
        container.style.bottom = '60px';
        container.style.left = '20px';
        container.style.zIndex = '9999';
        container.style.backgroundColor = '#fff';
        container.style.border = '1px solid #ccc';
        container.style.padding = '10px';
        container.style.fontSize = '14px';
        container.style.width = '300px';
        container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        container.innerHTML = `
            <h4 style="margin-top:0;">Backlist Land</h4>
            <table id="blacklistTable" border="1" style="width:100%; text-align:left; margin-bottom: 5px;">
              <thead><tr><th>Land</th><th>Xóa</th></tr></thead>
              <tbody></tbody>
            </table>
            <input type="text" id="newLandInput" placeholder="Nhập land..." style="width: 100%; margin-bottom: 5px;">
            <button id="addLandBtn" style="width: 100%;">Thêm back land</button>
        `;
        document.body.appendChild(container);

        const tableBody = container.querySelector('#blacklistTable tbody');
        const input = container.querySelector('#newLandInput');
        const button = container.querySelector('#addLandBtn');

        function loadBlacklist() {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        }

        function saveBlacklist(list) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }

        function renderTable() {
            const list = loadBlacklist();
            tableBody.innerHTML = '';
            list.forEach((land, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${land}</td>
                    <td><button data-index="${index}" class="delBtn">X</button></td>
                `;
                tableBody.appendChild(row);
            });

            container.querySelectorAll('.delBtn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-index'));
                    const list = loadBlacklist();
                    list.splice(index, 1);
                    saveBlacklist(list);
                    renderTable();
                });
            });
        }

        button.addEventListener('click', () => {
            const land = input.value.trim();
            if (land) {
                const list = loadBlacklist();
                if (!list.includes(land)) {
                    list.push(land);
                    saveBlacklist(list);
                    renderTable();
                }
                input.value = '';
            }
        });

        renderTable();
    }

    // Đợi đến khi có nút
    const waitForButton = setInterval(() => {
        const toggleBtn = document.getElementById('blacklistButton');
        if (toggleBtn) {
            clearInterval(waitForButton);
            toggleBtn.addEventListener('click', () => {
                if (document.getElementById('backlistContainer')) {
                    // Nếu đang hiển thị => xóa khỏi DOM
                    container.remove();
                    container = null;
                } else {
                    createBlacklistUI();
                }
            });
        }
    }, 300);
})();
(function () {
    'use strict';

    // State management
    let featureOneEnabled = false; // API timers
    let featureTwoEnabled = false; // API ent_mine_04
    let currentLands = [];
    let updateInterval = null;
    let taskInterval = null;
    let enabled = false;

    const WINDOW = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const createToggleUI = () => {
        const container = document.createElement('div');
        container.id = 'minebtn';
        Object.assign(container.style, {
            position: 'absolute', bottom: '0', right: '0', background: 'transparent',color: 'white',
            padding: '12px 16px', borderRadius: '8px', fontFamily: 'Arial, sans-serif',fontSize: '14px', zIndex: '9999', userSelect: 'none'
            ,width: '220px', transition: 'width 0.3s ease'
        });
        container.innerHTML = `
            <style>
             #blacklistButton,.icon-button{display:unset;width:40px;height:40px;margin:0 auto 8px;border:none;
             font-size:20px;transition:transform .2s,background-color .3s,box-shadow .2s,filter .2s;outline:0;
             background-repeat:no-repeat,repeat;background-size:contain;background-color:transparent;padding-top:0;cursor:pointer}.icon-button{align-items:center;justify-content:center;border-radius:6px}
             .icon-button.off{background-color:unset}.icon-button.on{background-color:#16a34a}
             #blacklistButton{align-items:center;justify-content:center;border-radius:6px;background-image:url(https://d31ss916pli4td.cloudfront.net/uploadedAssets/o/obj_witch_book_holder/8e0b55c9-71dc-401f-a062-84c0db04842c.png)}
             .icon-button:hover{transform:scale(1.1);box-shadow:0 4px 8px rgba(0,0,0,.3)}.icon-button:active{transform:scale(.95)}.icon-button:focus{outline:#fff solid 2px;outline-offset:2px}
             #toggleFeatureTwo{background-image:url(https://d31ss916pli4td.cloudfront.net/uploadedAssets/o/obj_pixelsdungeon_pick/f9fca235-1f6e-4c2e-8fa9-5e1c59bb21b0.png)}
             #toggleFeatureOne{background-image:url('https://assets.pixels.tips/images/industries/mine.webp');}
            </style>
            <button id="toggleFeatureOne" class="icon-button off" title="Toggle Nhận"></button>
            <button id="toggleFeatureTwo" class="icon-button off" title="Toggle Đào"></button>
             <button id="farmtype" class="icon-button off" title="Toggle farmtype"></button>
             <button id="blacklistButton" class="icon-button off" title="Nhập Blacklist"></button>
            <div id="landTableContainer" style="margin-top: 12px; max-height: 700px; overflow-y: auto; width: 500px;"></div>
        `;
        document.body.appendChild(container);
        document.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() === "e") {
                if (container.style.width === "0px") {
                    container.style.width = "220px";
                    container.style.padding = "12px 16px";
                } else {
                    container.style.width = "0px";
                    container.style.padding = "12px 0"; // co lại khi ẩn
                }
            }
        });
        const toggleOne = container.querySelector('#toggleFeatureOne');
        const toggleTwo = container.querySelector('#toggleFeatureTwo');
        const btntoime = document.getElementById('btntime');
        const farmBtn = container.querySelector('#farmtype');

        farmBtn.style.backgroundImage = "url('https://d31ss916pli4td.cloudfront.net/game/ui/skills/skills_icon_mining.png?v2')";
        farmBtn.addEventListener("click", () => {
            if (unsafeWindow.farm_type === "mine") {
                unsafeWindow.farm_type = "tree";
                farmBtn.style.backgroundImage = "url('https://d31ss916pli4td.cloudfront.net/game/ui/skills/skills_icon_forestry.png?v2')";
            } else {
                unsafeWindow.farm_type = "mine";
  farmBtn.style.backgroundImage = "url(https://d31ss916pli4td.cloudfront.net/game/ui/skills/skills_icon_mining.png?v2)";
            }
        });

        toggleOne.addEventListener('click', () => {
            featureOneEnabled = !featureOneEnabled;
            if (featureOneEnabled && featureTwoEnabled) {
                featureTwoEnabled = false;
                toggleTwo.classList.remove('on');
                toggleTwo.classList.add('off');
            }
            toggleOne.classList.toggle('on', featureOneEnabled);
            toggleOne.classList.toggle('off', !featureOneEnabled);

            unsafeWindow.minebutton = featureTwoEnabled; // cập nhật trạng thái chính xác
        });

        toggleTwo.addEventListener('click', () => {
            featureTwoEnabled = !featureTwoEnabled;
            if (featureTwoEnabled && featureOneEnabled) {
                featureOneEnabled = false;
                toggleOne.classList.remove('on');
                toggleOne.classList.add('off');
            }
            toggleTwo.classList.toggle('on', featureTwoEnabled);
            toggleTwo.classList.toggle('off', !featureTwoEnabled);

            unsafeWindow.minebutton = featureTwoEnabled; // chính xác ở đây

            if (!featureTwoEnabled) {
               // clearTable();
            }
        });
    };
    // Table Rendering
    const getTimeFromShortestWaiting = (shortestWaiting) => {
        const totalSeconds = Math.floor(shortestWaiting / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    };

    const renderLandTable = (data) => {
        const tableContainer = document.getElementById('landTableContainer');
if (!tableContainer) return;

const container = document.getElementById('minebtn');
if (container) {
    container.style.width = '500px'; // Expand to match table width
}

const BLACKLIST_LAND_IDS = JSON.parse(localStorage.getItem('backlistLand') || '[]');
const now = Date.now();

let lands = data?.[0]?.public || [];
 console.log(unsafeWindow.id_tree_land)
/*if (unsafeWindow.farm_type === "mine") {
    // mine: lọc như cũ + loại bỏ trong blacklist
    lands = lands.filter(land =>
        (unsafeWindow.mine_tiger === 3 || land.shortestWaiting >= 0) && land.numberOfAvailableEntities !== 1 && land.numberOfEntities >= 4 && land.entities.some(e => e.waiting <= 300000) &&
        !BLACKLIST_LAND_IDS.includes(land.landName.replace('pixelsNFTFarm-', ''))
    );
  */
        if (unsafeWindow.farm_type === "mine") {
    // mine: lọc như cũ + loại bỏ trong blacklist + chênh lệch entities ≤ 3 phút
    lands = lands.filter(land => {
        const cleanLandName = land.landName.replace('pixelsNFTFarm-', '');
        const isNotBlacklisted = !BLACKLIST_LAND_IDS.includes(cleanLandName);
        const validTigerOrWaiting = unsafeWindow.mine_tiger === 3 || land.shortestWaiting >= 0;
        const validEntitiesCount = land.numberOfAvailableEntities !== 1 && land.numberOfEntities >= 5;

        // Chỉ giữ land có ít nhất 1 entity waiting <= 5p
        const hasValidWaiting = land.entities.some(e => e.waiting <= 300000);

        // Chỉ giữ land nếu chênh lệch giữa min và max waiting ≤ 3p
        let waitingDiffOk = true;
        if (land.entities && land.entities.length > 0) {
            const waitings = land.entities.map(e => e.waiting);
            const minWaiting = Math.min(...waitings);
            const maxWaiting = Math.max(...waitings);
            waitingDiffOk = (maxWaiting - minWaiting) <= 180000; // 3 phút
        }

        return isNotBlacklisted && validTigerOrWaiting && validEntitiesCount && hasValidWaiting && waitingDiffOk;
    });
}
 else if (unsafeWindow.farm_type === "tree") {

lands = lands.filter(land => {
  const id = parseInt(land.landName.replace('pixelsNFTFarm-', '').trim(), 10);
  return unsafeWindow.id_tree_land.includes(id);
});
    console.log(lands);
}

currentLands = lands.slice(0, 50).map(land => ({
    landName: land.landName,
    numberOfEntities: land.numberOfEntities,
    numberOfAvailableEntities: land.numberOfAvailableEntities,
    numPlayers: land.numPlayers,
    shortestWaiting: land.shortestWaiting,

    startTime: now
}));

        const table = document.createElement('table');
        Object.assign(table.style, { width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '16px' });
        table.innerHTML = `
            <thead>
                <tr style="background: #333;">
                    <th style="padding: 6px; border: 1px solid #444;">Land</th>
                    <th style="padding: 6px; border: 1px solid #444;">Available|Total Entities</th>
                    <th style="padding: 6px; border: 1px solid #444;">Shortest Waiting</th>
                </tr>
            </thead>
        `;
        updateLandTable(table);
        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);

        if (currentLands.length && !updateInterval) {
            updateInterval = setInterval(() => updateLandTable(table), 1000);
        }

    };

    const updateLandTable = (table) => {
        const tbody = document.createElement('tbody');
        const now = Date.now();
/*        if (unsafeWindow.mine_tiger !== 3) {
    currentLands = currentLands.filter(land => (now - land.startTime) < land.shortestWaiting);
}*/

        if (currentLands.length) {
            currentLands.forEach(land => {
                const color =  (land.numPlayers === 0 ? "#6626ff" : "#be6464");
                const remaining = Math.max(0, land.shortestWaiting - (now - land.startTime));
                const cleanLandName = land.landName.replace('pixelsNFTFarm-', '');
                tbody.innerHTML += `
                    <tr>
                        <td style="padding: 0px; border: 1px solid #444; text-align: left;">
                            <button id ="land-${cleanLandName}" class="buttonland" style="background:${color};font-weight:bold;"
                                    onclick="window.setInputValue('${cleanLandName}')">🚀 ${cleanLandName}</button>
                        </td>
                        <td style="padding: 6px; border: 1px solid #444; text-align: center;">⛏️ ${land.numberOfAvailableEntities} / ${land.numberOfEntities} | 👷  ${land.numPlayers}</td>
                        <td style="padding: 6px; border: 1px solid #444; text-align: center;">${getTimeFromShortestWaiting(remaining)}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="3" style="padding: 6px; border: 1px solid #444; text-align: center;">No data available</td></tr>`;
        }

        const oldTbody = table.querySelector('tbody');
        if (oldTbody) table.replaceChild(tbody, oldTbody);
        else table.appendChild(tbody);

        if (!currentLands.length && updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    };

    const clearTable = () => {

        const tableContainer = document.getElementById('landTableContainer');
        const container = document.getElementById('minebtn');
        if (tableContainer) tableContainer.innerHTML = '';
        if (container) container.style.width = '220px'; // Revert to default width
        currentLands = [];
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    };
    const decodeTimers = (base64Str) => {
        try {
            const bytes = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
            return JSON.parse(pako.inflate(bytes, { to: 'string' }));
        } catch (error) {
            //console.error('Error decoding timers:', error);
            return null;
        }
    };

    const filterMineTimers = (timersData) => {
        try {
            const now = Date.now();
            const usedMapId = localStorage.getItem('lastUsedMapId');
            const filteredTimers = timersData.filter(timer =>
                timer.entity?.startsWith('ent_mine') && timer.mapId && !timer.mapId.startsWith('shareRent') && timer.endTime < now
            );

            if (!filteredTimers.length) return '';
            const chosenTimer = filteredTimers.find(t => t.mapId !== usedMapId) || filteredTimers[Math.floor(Math.random() * filteredTimers.length)];
            const cleanMapId = chosenTimer.mapId.replace('pixelsNFTFarm-', '');
            localStorage.setItem('lastUsedMapId', chosenTimer.mapId);
            return cleanMapId;
        } catch (error) {
            return '';
        }
    };

    const processEntMineData = (data) => {
        if (!data?.[0]?.public?.length) return;
        renderLandTable(data);
    };

    const setInputValue = (farmLand) => {
        const input = document.querySelector('.LandAndTravel_numberInput__Re9sf');
        const triggerBox = document.querySelector('.LandAndTravel_option__P_QSA');
        if (!input || !triggerBox) return;

        setTimeout(() => {
            triggerBox.click();
            input.focus();
            input.click();
            Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, farmLand);
            input.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                if (input.value === farmLand) {
                    const confirmButton = document.querySelector('.LandAndTravel_optionButtons__5tDIJ button');
                    if (confirmButton) {
                        confirmButton.click();
                        clearTable();
                    }
                }
            }, 500);
        }, 500);
    };
    WINDOW.setInputValue = setInputValue;

    const fetchTimers = async () => {
        if (!featureOneEnabled) return;
      //  window.minebutton = false
        const pid = WINDOW.pga?.helpers?.getReduxValue()?.game?.player?.core?.mid || '';
        try {
            const res = await fetch('https://api-pixels.guildpal.com/stats-api/timers/gettimers', {
                method: 'GET',
                headers: { 'x-atomrigs-pga-pid': pid, 'x-atomrigs-pga-version': '1.1.4' }
            });
            const data = await res.json();
            if (data?.data?.timers) {
                const decoded = decodeTimers(data.data.timers);
                if (decoded) setInputValue(filterMineTimers(decoded));
            }
        } catch (err) {
            //console.error('Fetch timers failed:', err);
        }
    };

  const fetchEntMine = async () => {
    if (!featureTwoEnabled) return;
    try {
        let data; // khai báo 1 lần ở ngoài
        if (unsafeWindow.farm_type === "mine") {
            const tiger = unsafeWindow.mine_tiger;
            const landType = (tiger === 3) ? 'water' : 'space'; // 3 => water, 4 => space
            const res = await fetch(`https://industry.guildpal.com/v2/entities/ent_mine_04?landtypes=${landType}&count=30&includeHouse=false`);
            data = await res.json();
        } else {
            const res = await fetch(`https://industry.guildpal.com/v2/entities/ent_tree?tier=4&includeHouse=true`);
            data = await res.json();
        }
        processEntMineData(data);
    } catch (err) {
        // console.error('Fetch ent_mine failed:', err);
    }
};

    // Observer Setup
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.querySelector('.LandAndTravel_numberInput__Re9sf')) {
                    if (featureOneEnabled) fetchTimers();
                    if (featureTwoEnabled) {unsafeWindow.openPanel();fetchEntMine()};

                }
            }
            for (const node of mutation.removedNodes) {
                if (node.nodeType === 1 && node.querySelector('.LandAndTravel_numberInput__Re9sf') && featureTwoEnabled) {
                    clearTable();
                    unsafeWindow.closePanel();
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('load', createToggleUI);
    // Khởi tạo giá trị mặc định


function addToggleButton() {
  const blacklistButton = document.querySelector('#blacklistButton');
  if (!blacklistButton) return;
  if (document.querySelector('.profitPerEnergyToggle')) return;
  const toggleImg = document.createElement('img');
  toggleImg.className = 'profitPerEnergyToggle';
  toggleImg.src = 'https://assets.pixels.tips/images/icons/land-space.webp';
  toggleImg.style.cursor = 'pointer';
  toggleImg.style.width = '50px';
  toggleImg.style.height = 'auto';
  toggleImg.style.background = 'beige';
  toggleImg.style.padding = '5px';
  toggleImg.style.marginRight = '5px';
  toggleImg.style.marginLeft = 'auto';
  blacklistButton.insertAdjacentElement('afterend', toggleImg);

  toggleImg.addEventListener('click', () => {
    const isOn = toggleImg.src.includes('https://assets.pixels.tips/images/icons/land-space.webp');
    if (isOn) {
      toggleImg.src = 'https://assets.pixels.tips/images/icons/land-water.webp';
      unsafeWindow.mine_tiger = 3;
    } else {
      toggleImg.src = 'https://assets.pixels.tips/images/icons/land-space.webp';
      unsafeWindow.mine_tiger = 4;
    }
  });
}
function button_auto() {
  const blacklistButton = document.querySelector('#blacklistButton');
  if (!blacklistButton) return;
  if (document.querySelector('.automation')) return;
  const toggleImg = document.createElement('img');
  toggleImg.className = 'automation';
  toggleImg.src = 'https://guildpal.com/images/pga/toggle-off.png';
  toggleImg.style.cursor = 'pointer';
  toggleImg.style.width = '50px';
  toggleImg.style.height = 'auto';
  toggleImg.style.background = 'beige';
  toggleImg.style.padding = '5px';
  toggleImg.style.marginRight = '5px';
  toggleImg.style.marginLeft = 'auto';
  blacklistButton.insertAdjacentElement('afterend', toggleImg);

  toggleImg.addEventListener('click', () => {
    const isOn = toggleImg.src.includes('https://guildpal.com/images/pga/toggle-on.png');
    if (isOn) {
      toggleImg.src = 'https://guildpal.com/images/pga/toggle-off.png';
      unsafeWindow.auto = 'off';
    } else {
      toggleImg.src = 'https://guildpal.com/images/pga/toggle-on.png';
      unsafeWindow.auto = 'on';
    }
  });
}
const observer_button = new MutationObserver(() => {
  if (document.querySelector('#blacklistButton')) {
    addToggleButton();
      button_auto()
    observer_button.disconnect();
  }
});

observer_button.observe(document.body, { childList: true, subtree: true });

})();


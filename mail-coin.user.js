// ==UserScript==
// @name         Read Mail send save google sheet
// @version      1.7
// @description  Theo dõi mail coin, gửi về webhook khi collect mail trên Pixels.xyz
// @icon         https://play.pixels.xyz/favicon/favicon.ico
// @author       Drayke
// @match        *://play.pixels.xyz/*
// @updateURL    https://raw.githubusercontent.com/omqn9696/extendsionpga/refs/heads/main/mail-coin.meta.js
// @downloadURL  https://raw.githubusercontent.com/omqn9696/extendsionpga/refs/heads/main/mail-coin.user.js
// @grant        none
// ==/UserScript==
(function() {
    'use strict';

    // URL webhook của bạn
    const WEBHOOK_URL = "https://n8n.exquisitefly.net/webhook/87751bd6-99dd-46b6-8893-7e023d97b636";
    window.coin_balance = {
        cur_coins: null,
        cur_pixel: null
    };


    function log_coin(params) {
        // Chỉ check cur_coins và cur_pixel
        ["cur_coins", "cur_pixel"].forEach(id => {
            const coinObj = params.coinInventory?.find(c => c.currencyId === id);
            if (!coinObj) return;

            const oldBalance = window.coin_balance[id];
            const newBalance = coinObj.balance;

            if (oldBalance === null) {
                // Lần đầu: lưu số dư ban đầu
                window.coin_balance[id] = newBalance;
            } else {
                const diff = newBalance - oldBalance;
                if (diff !== 0) {
                    window.coin_balance[id] = newBalance;

                    fetch(WEBHOOK_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "change",
                            currencyId: id,
                            old: oldBalance,
                            new: newBalance,
                            diff: diff,
                            timestamp: Date.now()
                        })
                    });
                }
            }
        });
    }
    [
    {
        "kind": "speed15",
        "colour": "#00a1ff"
    },
    {
        "kind": "particle2",
        "colour": "#ffcc00"
    },
    {
        "kind": "particle6"
    }
]
    function mod_skin(){
        if(window.pga.helpers.getRoomScene()){
            const a =  window.pga.helpers.getRoomScene().selfPlayer.playerData;
            if(a.avatar.id == "genju"){
            //console.log(a)

                switch(a.avatar.display.tokenId) {
                    case '1374':
                        a.avatar.display = {
                        "avatarId": "genju",
                        "tokenId": "27",
                        "symbol": "GENJU",
                        "nft": true,
                        "image": "ipfs://QmcGYUq15moEzWRjgf89EAgvGnjcZEFtneFWYo7chL7kTw/27",
                        "name": "Genju Genesisstrigidae",
                        "chain": "ronin",
                        "body": "undefined",
                        "clothing": "undefined",
                        "zombieeyes": "undefined",
                        "eyes": "sad",
                        "zombiemouth": "undefined",
                        "zombieheadwear": "undefined",
                        "eyewear": "undefined",
                        "mouth": "undefined",
                        "headwear": "undefined",
                        "specialheadwear": "undefined",
                        "onesies": "undefined",
                        "honorary": "undefined",
                        "1of1": "akumanosenshi"
                    }
                        break;
                    case '1373':
                       a.avatar.display = {
                        "avatarId": "genju",
                        "tokenId": "27",
                        "symbol": "GENJU",
                        "nft": true,
                        "image": "ipfs://QmcGYUq15moEzWRjgf89EAgvGnjcZEFtneFWYo7chL7kTw/27",
                        "name": "Genju Genesisstrigidae",
                        "chain": "ronin",
                        "body": "white",
                        "clothing": "undefined",
                        "zombieeyes": "undefined",
                        "eyes": "sad",
                        "zombiemouth": "undefined",
                        "zombieheadwear": "undefined",
                        "eyewear": "skigoggles",
                        "mouth": "smile",
                        "headwear": "undefined",
                        "specialheadwear": "undefined",
                        "onesies": "sharkonesie",
                        "honorary": "undefined",
                        "1of1": "undefined"
                    }
                        break;
                        // code block
                }

            }
            //console.log(a)
            a.modifiers.push(
                {
                    kind: "particle6"
                },
                {
                    kind: "particle2",
                    colour: "#ffcc00"
                }
            );

            delete a.kind,
                window.pga.helpers.getRoomScene().selfPlayer.updatePlayerData((a)),
                window.pga.helpers.getRoomScene().removeNode( window.pga.helpers.getRoomScene().selfPlayer),
                window.pga.helpers.getRoomScene().nodesToAdd.push(window.pga.helpers.getRoomScene().selfPlayer)

        }
    }
    // Hàm tiện ích chờ cho onGameEvent sẵn sàng
    function waitForOnGameEvent(callback) {
        const check = setInterval(() => {
            if (typeof window.onGameEvent === "function") {
                clearInterval(check);
                callback();
            }
        }, 300);
    }

    // Hàm gửi JSON tới webhook
    async function postJSON(url, data) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return res;
    }

    // Hàm saveMail: cộng dồn, tránh rỗng, tránh trùng
    function saveMail(data) {
        try {
            let mails = [];

            if (Array.isArray(data.mail)) {
                mails = data.mail;
            } else if (data.mail && Array.isArray(data.mail.mail)) {
                mails = data.mail.mail;
            }

            if (!mails.length) return;

            if (!window.onmail_coin || !Array.isArray(window.onmail_coin.mail)) {
                window.onmail_coin = { mail: [] };
            }

            mails.forEach(m => {
                const isDuplicate = window.onmail_coin.mail.some(
                    existing => JSON.stringify(existing) === JSON.stringify(m)
                );
                if (!isDuplicate) {
                    window.onmail_coin.mail.push(m);
                }
            });

            //console.log("[SAVE MAIL]", window.onmail_coin.mail);
        } catch (e) {
            console.error("Lỗi saveMail:", e);
        }
    }
 function clickportal(data) {
    if(data.entity == "ent_infiniportal"){
        document.querySelector('.voxels-industry-select-reload.clickable')?.click();
        //console.log(data)
    }
}
    // Đăng ký sự kiện khi onGameEvent sẵn sàng
    waitForOnGameEvent(() => {
        window.onGameEvent("PLAYER_COIN_INVENTORY_CHANGE", log_coin);// bắt sự thay đổi của coin
        window.onGameEvent("ready", mod_skin);
        // Nhận mail
        window.onGameEvent("clickEntity",clickportal);
        window.onGameEvent("RECEIVE_MAIL", saveMail);
        window.sentMailIds = window.sentMailIds || new Set();
        window.sent_mails = window.sent_mails || [];

        window.onGameEvent("COLLECT_MAIL_ITEM", async (data) => {
            try {
                if (!window.onmail_coin || !Array.isArray(window.onmail_coin.mail)) {
                    // console.warn("[COLLECT] Không có dữ liệu mail trong window.onmail_coin");
                    return;
                }

                const { mailId, similar } = data;
                const found = window.onmail_coin.mail.find(m => m._id === mailId);

                if (found && similar === true) {
                    // Nếu đã gửi rồi thì bỏ qua
                    if (window.sentMailIds.has(mailId)) {
                        // console.log("[COLLECT] Mail", mailId, "đã gửi trước đó → bỏ qua.");
                        return;
                    }

                    //  console.log("%c[COLLECTED MAIL CONFIRMED]", "color: orange; font-weight:bold;", found);

                    const payload = {
                        status: "sent",
                        source: "COLLECT_MAIL_ITEM",
                        at: new Date().toLocaleString("en-CA", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }).replace(",", ""),
                        collected: found,
                        onmail_coin: window.onmail_coin
                    };

                    try {
                        const res = await fetch(WEBHOOK_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });

                        if (res.ok) {
                            // Đánh dấu đã gửi bằng cách lưu id vào Set
                            window.sentMailIds.add(mailId);

                            // Lưu bản copy để debug/lịch sử
                            window.sent_mails.push({ ...found, sentAt: payload.at });
                            window.onmail_coin = { mail: [] };
                            //console.log("%c[WEBHOOK] Đã gửi & đánh dấu mailId", "color: lime; font-weight:bold;", mailId);
                        } else {
                            //console.warn("[WEBHOOK] Gửi nhưng HTTP không OK:", res.status);
                        }
                    } catch (err) {
                        // console.error("[WEBHOOK] Lỗi gửi webhook:", err);
                    }
                }
            } catch (e) {
                //console.error("Lỗi xử lý COLLECT_MAIL_ITEM:", e);
            }
        });
    });

})();

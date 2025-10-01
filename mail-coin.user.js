// ==UserScript==
// @name         Read Mail send save google sheet
// @version      1.4
// @description  Theo dõi mail coin, gửi về webhook khi collect mail trên Pixels.xyz
// @author       Drayke
// @match        *://play.pixels.xyz/*
// @updateURL    https://raw.githubusercontent.com/omqn9696/extendsionpga/refs/heads/main/mail-coin.meta.js
// @downloadURL  https://raw.githubusercontent.com/omqn9696/extendsionpga/refs/heads/main/mail-coin.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // URL webhook
  const WEBHOOK_URL = "https://n8n.exquisitefly.net/webhook/87751bd6-99dd-46b6-8893-7e023d97b636";

  // Chờ onGameEvent sẵn sàng
  function waitForOnGameEvent(callback) {
    const check = setInterval(() => {
      if (typeof window.onGameEvent === "function") {
        clearInterval(check);
        callback();
      }
    }, 300);
  }

  // Gửi JSON tới webhook
  async function postJSON(url, data) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res;
  }

  // Lưu mail (tránh trùng)
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
    } catch (e) {
      console.error("Lỗi saveMail:", e);
    }
  }

  // Đăng ký sự kiện khi onGameEvent sẵn sàng
  waitForOnGameEvent(() => {
    // Nhận mail
    window.onGameEvent("RECEIVE_MAIL", saveMail);

    window.sentMailIds = window.sentMailIds || new Set();
    window.sent_mails = window.sent_mails || [];

    window.onGameEvent("COLLECT_MAIL_ITEM", async (data) => {
      try {
        if (!window.onmail_coin || !Array.isArray(window.onmail_coin.mail)) {
          return;
        }

        const { mailId, similar } = data;
        const found = window.onmail_coin.mail.find(m => m._id === mailId);

        if (found && similar === true) {
          // Bỏ qua nếu đã gửi
          if (window.sentMailIds.has(mailId)) {
            return;
          }

          const payload = {
            status: "sent",
            source: "COLLECT_MAIL_ITEM",
            at: new Date()
              .toLocaleString("en-CA", { timeZone: "Asia/Ho_Chi_Minh", hour12: false })
              .replace(",", ""),
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
              window.sentMailIds.add(mailId);
              window.sent_mails.push({ ...found, sentAt: payload.at });

              // Reset lại để tránh gửi trùng
              window.onmail_coin = { mail: [] };
            } else {
              // console.warn("Webhook gửi nhưng HTTP không OK:", res.status);
            }
          } catch (err) {
            // console.error("Webhook lỗi gửi:", err);
          }
        }
      } catch (e) {
        // console.error("Lỗi xử lý COLLECT_MAIL_ITEM:", e);
      }
    });
  });

})();

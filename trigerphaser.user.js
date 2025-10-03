// ==UserScript==
// @name         Triger game event
// @version      1.3
// @description  xàm
// @icon         https://play.pixels.xyz/favicon/favicon.ico
// @author       Drayke
// @match        *://play.pixels.xyz/*
// @grant        none
// ==/UserScript==


(function() {
    'use strict';
    function hookPhaserEvents() {
        const EE = window.Phaser?.Events?.EventEmitter;
        if (!EE) return console.warn("Không tìm thấy Phaser.Events.EventEmitter");

        const origEmit = EE.prototype.emit;
        const skip = [
            "render","prerender","preupdate","update","postupdate",
            "removedfromscene","addedtoscene",
            "PLAYER_QUESTPROGRESS_ADDED","PLAYER_ACHIEVEMENT_ADD",
            "PLAYER_LEVEL_ADD","ROOM_LEVEL_ADD"
        ];

        const eventTriggers = {};

        window.onGameEvent = function(eventName, callback) {
            if (!eventTriggers[eventName]) eventTriggers[eventName] = [];
            eventTriggers[eventName].push(callback);
        };

        // Hook emit
        EE.prototype.emit = function(event, ...args) {
            if (!skip.includes(event)) {
                if (eventTriggers[event]) {
                    eventTriggers[event].forEach(cb => {
                        try { cb(...args); } catch (e) { console.error(e); }
                    });
                }
            }
            return origEmit.apply(this, [event, ...args]);
        };
    }
    const checkInterval = setInterval(() => {
        if (window.Phaser?.Events?.EventEmitter) {
            clearInterval(checkInterval);
            hookPhaserEvents();
        }
    }, 500);
})();

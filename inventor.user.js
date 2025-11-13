function clickHotbarShortcut(number) {
    const items = document.querySelectorAll(".Hud_item__YGtIC");

    // Tìm item có shortcut = number
    for (const el of items) {
        const shortcutEl = el.querySelector(".Hud_shortcut__UvE3h");
        if (!shortcutEl) continue;

        const shortcutValue = shortcutEl.textContent.trim();
        if (shortcutValue == number) {
            // Lấy Fiber
            const fiberKey = Object.keys(el).find(k => k.startsWith("__reactFiber"));
            const fiber = el[fiberKey];
            const handler = fiber?.pendingProps?.onClick;

            if (typeof handler !== "function") {
                console.warn(`❌ Slot ${number} không có onClick`);
                return;
            }

            const fakeEvent = {
                preventDefault(){},
                stopPropagation(){},
                shiftKey:false,
                ctrlKey:false,
                altKey:false,
                metaKey:false,
                button:0,
            };

            handler(fakeEvent);
            console.log("🔥 CLICK HOTBAR SHORTCUT:", number, "→ SLOT:", fiber.pendingProps.slot);
            return;
        }
    }

    console.warn(`❌ Không tìm thấy shortcut = ${number}`);
}

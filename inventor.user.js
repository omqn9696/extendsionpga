function clickHotbar(index) {
    const els = document.querySelectorAll(".Hud_item__YGtIC");
    const el = els[index];
    if (!el) return;

    const fiberKey = Object.keys(el).find(k => k.startsWith("__reactFiber"));
    const fiber = el[fiberKey];
    const handler = fiber?.pendingProps?.onClick;

    if (typeof handler !== "function") return;

    const e = {
        preventDefault(){},
        stopPropagation(){},
        shiftKey:false,
        ctrlKey:false,
        altKey:false,
        button:0,
    };

    handler(e);
    console.log("🔵 SELECT SLOT:", fiber.pendingProps.slot);
}

/* Entry point. Starts each module independently so a failure in one
   feature cannot take the rest of the page down with it. */
(function (WB) {
    "use strict";

    const MODULES = ["navigation", "faq", "modal", "animations", "forms"];

    /* Keeps the copyright honest without touching every page each January. */
    function stampYear() {
        const year = String(new Date().getFullYear());

        WB.utils.$$("[data-year]").forEach((node) => {
            node.textContent = year;
        });
    }

    /* A blocked or missing photo should leave a calm placeholder behind
       rather than a broken-image icon in the middle of a layout. */
    function guardImages() {
        document.addEventListener(
            "error",
            (event) => {
                const image = event.target;
                if (!image || image.tagName !== "IMG" || image.dataset.failed) return;

                image.dataset.failed = "true";
                image.removeAttribute("srcset");
                image.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='10'%3E%3Crect width='16' height='10' fill='%23eef2f8'/%3E%3C/svg%3E";
            },
            true /* error events do not bubble, so listen on the capture phase */
        );
    }

    function start() {
        guardImages();
        stampYear();

        MODULES.forEach((name) => {
            if (!WB[name] || typeof WB[name].init !== "function") return;

            try {
                WB[name].init();
            } catch (error) {
                if (window.console) window.console.error("[WorkBridge] " + name + " failed", error);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})(window.WB);

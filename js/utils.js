/* Shared helpers. Loaded first — every other module reads from window.WB. */
window.WB = window.WB || {};

(function (WB) {
    "use strict";

    const $ = (selector, scope) => (scope || document).querySelector(selector);
    const $$ = (selector, scope) =>
        Array.prototype.slice.call((scope || document).querySelectorAll(selector));

    const FOCUSABLE = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled]):not([type=hidden])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    /* Freeze the page behind an overlay. The padding compensation stops the
       layout jumping sideways when the scrollbar disappears on desktop. */
    function lockScroll(shouldLock) {
        const gap = window.innerWidth - document.documentElement.clientWidth;

        document.body.classList.toggle("is-locked", shouldLock);
        document.body.style.paddingRight = shouldLock && gap > 0 ? gap + "px" : "";
    }

    /* Keeps Tab cycling inside an open drawer or modal. */
    function trapFocus(container, event) {
        if (event.key !== "Tab") return;

        const items = $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null);
        if (!items.length) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    /* Trailing-edge throttle built on rAF — used for scroll listeners. */
    function onFrame(callback) {
        let scheduled = false;

        return function () {
            if (scheduled) return;
            scheduled = true;

            window.requestAnimationFrame(() => {
                scheduled = false;
                callback();
            });
        };
    }

    WB.utils = { $, $$, FOCUSABLE, prefersReducedMotion, lockScroll, trapFocus, onFrame };
})(window.WB);

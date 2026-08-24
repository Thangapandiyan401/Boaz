/* GENERATED FILE - do not edit directly.
   Edit the source modules listed below, then run: node tools/build-assets.js */

/* Sources: js/utils.js, js/navigation.js, js/faq.js, js/modal.js, js/animations.js, js/forms.js, js/main.js */

/* ===== js/utils.js ===== */

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

/* ===== js/navigation.js ===== */

/* Header behaviour: sticky state, desktop dropdowns and the mobile drawer. */
(function (WB) {
    "use strict";

    const { $, $$, lockScroll, trapFocus, onFrame } = WB.utils;
    const DESKTOP = window.matchMedia("(min-width: 992px)");

    let header;
    let drawer;
    let scrim;
    let toggle;
    let lastFocused = null;

    /* --- Sticky header ---------------------------------------------------- */

    function watchScroll() {
        const update = onFrame(() => {
            header.classList.toggle("is-stuck", window.scrollY > 8);
        });

        update();
        window.addEventListener("scroll", update, { passive: true });
    }

    /* --- Desktop dropdowns ------------------------------------------------ */

    function closeDropdowns(except) {
        $$(".nav-item.is-open").forEach((item) => {
            if (item === except) return;
            item.classList.remove("is-open");
            item.querySelector(".nav-link").setAttribute("aria-expanded", "false");
        });
    }

    function setDropdown(item, open) {
        item.classList.toggle("is-open", open);
        item.querySelector(".nav-link").setAttribute("aria-expanded", String(open));
    }

    function initDropdowns() {
        const items = $$(".nav-item--has-panel");
        if (!items.length) return;

        items.forEach((item) => {
            const trigger = item.querySelector(".nav-link");

            trigger.addEventListener("click", (event) => {
                event.preventDefault();
                const willOpen = !item.classList.contains("is-open");
                closeDropdowns(item);
                setDropdown(item, willOpen);
            });

            /* Pointer users get hover; the click handler still serves keyboards. */
            item.addEventListener("mouseenter", () => {
                if (!DESKTOP.matches) return;
                closeDropdowns(item);
                setDropdown(item, true);
            });

            item.addEventListener("mouseleave", () => {
                if (!DESKTOP.matches) return;
                setDropdown(item, false);
            });

            /* Close once focus moves out of the panel entirely. */
            item.addEventListener("focusout", (event) => {
                if (!item.contains(event.relatedTarget)) setDropdown(item, false);
            });
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".nav-item--has-panel")) closeDropdowns();
        });
    }

    /* --- Mobile drawer ---------------------------------------------------- */

    function openDrawer() {
        lastFocused = document.activeElement;
        drawer.classList.add("is-open");
        scrim.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");
        toggle.setAttribute("aria-expanded", "true");
        lockScroll(true);

        const first = drawer.querySelector(".mobile-nav__close");
        if (first) first.focus();
    }

    function closeDrawer() {
        if (!drawer.classList.contains("is-open")) return;

        drawer.classList.remove("is-open");
        scrim.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");
        toggle.setAttribute("aria-expanded", "false");
        lockScroll(false);

        if (lastFocused) lastFocused.focus();
    }

    function initDrawer() {
        toggle.addEventListener("click", () => {
            const isOpen = drawer.classList.contains("is-open");
            isOpen ? closeDrawer() : openDrawer();
        });

        scrim.addEventListener("click", closeDrawer);

        const closeButton = drawer.querySelector(".mobile-nav__close");
        if (closeButton) closeButton.addEventListener("click", closeDrawer);

        /* Any navigation link closes the drawer so the target page is visible. */
        drawer.addEventListener("click", (event) => {
            if (event.target.closest("a")) closeDrawer();
        });

        drawer.addEventListener("keydown", (event) => trapFocus(drawer, event));

        document.addEventListener("keydown", (event) => {
            if (event.key !== "Escape") return;
            closeDrawer();
            closeDropdowns();
        });

        /* A drawer left open while rotating to desktop would be stranded. */
        DESKTOP.addEventListener("change", (event) => {
            if (event.matches) closeDrawer();
        });
    }

    /* Collapsible groups inside the drawer. */
    function initDrawerGroups() {
        $$("[data-drawer-toggle]", drawer).forEach((button) => {
            const panel = button.nextElementSibling;
            panel.inert = button.getAttribute("aria-expanded") !== "true";

            button.addEventListener("click", () => {
                const expanded = button.getAttribute("aria-expanded") === "true";
                button.setAttribute("aria-expanded", String(!expanded));
                panel.inert = expanded;
            });
        });
    }

    /* --- Current page highlighting ---------------------------------------- */

    /* The header markup is identical on every page, so the active link is
       resolved at runtime from the URL rather than hand-marked per page. */
    function markCurrentPage() {
        const path = window.location.pathname.replace(/index\.html$/, "").replace(/\/$/, "");

        $$(".nav-link[href], .mobile-nav__link[href]").forEach((link) => {
            const href = link.getAttribute("href");
            if (!href || href.charAt(0) === "#") return;

            const target = new URL(href, window.location.href).pathname
                .replace(/index\.html$/, "")
                .replace(/\/$/, "");

            if (target === path) link.setAttribute("aria-current", "page");
        });
    }

    function init() {
        header = $(".site-header");
        drawer = $(".mobile-nav");
        scrim = $(".nav-scrim");
        toggle = $(".nav-toggle");

        if (!header) return;

        watchScroll();
        initDropdowns();
        markCurrentPage();

        if (drawer && scrim && toggle) {
            initDrawer();
            initDrawerGroups();
        }
    }

    WB.navigation = { init };
})(window.WB);

/* ===== js/faq.js ===== */

/* Accordion used by the FAQ sections. Add data-multi to an .accordion to let
   several panels stay open at once; by default opening one closes the rest. */
(function (WB) {
    "use strict";

    const { $$ } = WB.utils;

    function setOpen(item, open) {
        const trigger = item.querySelector(".accordion__trigger");
        const panel = item.querySelector(".accordion__panel");

        item.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", String(open));

        /* The panel stays in the DOM so its height can animate. `inert` keeps
           collapsed answers out of the tab order and the screen-reader flow. */
        panel.inert = !open;
    }

    function initAccordion(accordion) {
        const items = $$(".accordion__item", accordion);
        const allowMultiple = accordion.hasAttribute("data-multi");

        items.forEach((item) => {
            const trigger = item.querySelector(".accordion__trigger");
            if (!trigger) return;

            setOpen(item, item.classList.contains("is-open"));

            trigger.addEventListener("click", () => {
                const willOpen = !item.classList.contains("is-open");

                if (!allowMultiple) {
                    items.forEach((other) => {
                        if (other !== item) setOpen(other, false);
                    });
                }

                setOpen(item, willOpen);
            });
        });
    }

    function init() {
        $$(".accordion").forEach(initAccordion);
    }

    WB.faq = { init };
})(window.WB);

/* ===== js/modal.js ===== */

/* Lightweight modal. Buttons opt in with data-modal-open="<dialog id>".
   Used for the sign-in / sign-up placeholders, which are deliberately
   informational only — this site has no authentication behind it. */
(function (WB) {
    "use strict";

    const { $, $$, lockScroll, trapFocus } = WB.utils;

    let openModal = null;
    let lastFocused = null;

    function open(modal) {
        if (!modal) return;

        lastFocused = document.activeElement;
        openModal = modal;

        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        lockScroll(true);

        const closeButton = modal.querySelector(".modal__close");
        if (closeButton) closeButton.focus();
    }

    function close() {
        if (!openModal) return;

        openModal.classList.remove("is-open");
        openModal.setAttribute("aria-hidden", "true");
        lockScroll(false);
        openModal = null;

        if (lastFocused) lastFocused.focus();
    }

    function init() {
        const modals = $$(".modal");
        if (!modals.length) return;

        document.addEventListener("click", (event) => {
            const trigger = event.target.closest("[data-modal-open]");
            if (!trigger) return;

            event.preventDefault();
            open($("#" + trigger.getAttribute("data-modal-open")));
        });

        modals.forEach((modal) => {
            modal.addEventListener("click", (event) => {
                if (event.target.closest(".modal__scrim, [data-modal-close]")) close();
            });

            modal.addEventListener("keydown", (event) => trapFocus(modal, event));
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") close();
        });
    }

    WB.modal = { init, open, close };
})(window.WB);

/* ===== js/animations.js ===== */

/* Scroll-triggered reveals and the counting statistics.
   Everything degrades to "already visible" when IntersectionObserver is
   missing or the visitor has asked for reduced motion. */
(function (WB) {
    "use strict";

    const { $$, prefersReducedMotion } = WB.utils;

    function showAll() {
        $$(".reveal, .reveal-group").forEach((el) => el.classList.add("is-visible"));
        $$("[data-count-to]").forEach((el) => {
            el.textContent = el.getAttribute("data-count-to") + (el.getAttribute("data-suffix") || "");
        });
    }

    function initReveals() {
        const targets = $$(".reveal, .reveal-group");
        if (!targets.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                });
            },
            { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
        );

        targets.forEach((target) => observer.observe(target));
    }

    /* Counts a number up once, the first time it scrolls into view. */
    function countUp(el) {
        const target = parseFloat(el.getAttribute("data-count-to"));
        const suffix = el.getAttribute("data-suffix") || "";
        const decimals = (String(target).split(".")[1] || "").length;
        const duration = 1200;
        let started = null;

        function frame(now) {
            if (started === null) started = now;

            const progress = Math.min((now - started) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            el.textContent = (target * eased).toFixed(decimals) + suffix;

            if (progress < 1) window.requestAnimationFrame(frame);
        }

        window.requestAnimationFrame(frame);
    }

    function initCounters() {
        const counters = $$("[data-count-to]");
        if (!counters.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    countUp(entry.target);
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.6 }
        );

        counters.forEach((counter) => observer.observe(counter));
    }

    function init() {
        if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
            showAll();
            return;
        }

        initReveals();
        initCounters();
    }

    WB.animations = { init };
})(window.WB);

/* ===== js/forms.js ===== */

/* Client-side validation for the static enquiry forms.
   There is no backend on this site: a valid submission swaps in a success
   panel and nothing is transmitted or stored. The submit handler is kept
   in one place so a real endpoint can be dropped into sendEnquiry() later. */
(function (WB) {
    "use strict";

    const { $, $$ } = WB.utils;
    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function validateField(field) {
        const input = $("input, select, textarea", field);
        if (!input) return true;

        const value = input.value.trim();
        const errorNode = $(".field__error", field);
        let message = "";

        if (input.required && !value) {
            message = "This field is required.";
        } else if (value && input.type === "email" && !EMAIL.test(value)) {
            message = "Enter a valid email address.";
        } else if (value && input.type === "tel" && value.replace(/\D/g, "").length < 8) {
            message = "Enter a valid phone number.";
        }

        field.classList.toggle("has-error", Boolean(message));
        input.setAttribute("aria-invalid", message ? "true" : "false");

        if (errorNode && message) errorNode.textContent = message;

        return !message;
    }

    /* Placeholder for a future API call, form service or mailto handoff. */
    function sendEnquiry(form) {
        const data = Object.fromEntries(new FormData(form).entries());

        if (window.console && window.console.info) {
            window.console.info("[WorkBridge] Enquiry captured (no backend connected):", data);
        }

        return Promise.resolve();
    }

    function initForm(form) {
        const fields = $$(".field", form);
        const success = form.parentElement.querySelector(".form-success");

        /* Re-validate on blur once, then live, so people are not nagged while
           they are still typing their first answer. */
        fields.forEach((field) => {
            const input = $("input, select, textarea", field);
            if (!input) return;

            input.addEventListener("blur", () => validateField(field));
            input.addEventListener("input", () => {
                if (field.classList.contains("has-error")) validateField(field);
            });
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const invalid = fields.filter((field) => !validateField(field));

            if (invalid.length) {
                const input = $("input, select, textarea", invalid[0]);
                if (input) input.focus();
                return;
            }

            const button = $("[type=submit]", form);
            if (button) {
                button.setAttribute("aria-disabled", "true");
                button.textContent = "Sending...";
            }

            sendEnquiry(form).then(() => {
                form.hidden = true;
                if (success) {
                    success.classList.add("is-visible");
                    success.setAttribute("tabindex", "-1");
                    success.focus();
                }
            });
        });
    }

    function init() {
        $$("form[data-validate]").forEach(initForm);
    }

    WB.forms = { init };
})(window.WB);

/* ===== js/main.js ===== */

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

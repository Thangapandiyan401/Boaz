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

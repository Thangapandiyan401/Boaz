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

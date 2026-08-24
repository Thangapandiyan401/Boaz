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

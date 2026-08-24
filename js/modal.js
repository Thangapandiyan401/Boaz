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

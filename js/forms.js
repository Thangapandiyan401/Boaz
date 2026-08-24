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

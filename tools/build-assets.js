#!/usr/bin/env node
/* ============================================================================
   Concatenates the authored CSS and JS modules into the two files the pages
   actually request. The modules stay small and readable; the browser makes
   one request for each instead of fourteen.

       node tools/build-assets.js

   Order matters: variables and the reset come first, utils before the
   modules that read from it, main.js last.
   ========================================================================= */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const BUNDLES = [
    {
        out: "css/site.css",
        comment: "/* %s */\n\n",
        sources: [
            "css/variables.css",
            "css/reset.css",
            "css/base.css",
            "css/layout.css",
            "css/components.css",
            "css/sections.css",
            "css/animations.css",
            "css/responsive.css"
        ]
    },
    {
        out: "js/site.js",
        comment: "/* %s */\n\n",
        sources: [
            "js/utils.js",
            "js/navigation.js",
            "js/faq.js",
            "js/modal.js",
            "js/animations.js",
            "js/forms.js",
            "js/main.js"
        ]
    }
];

const BANNER = "GENERATED FILE - do not edit directly.\n" +
    "   Edit the source modules listed below, then run: node tools/build-assets.js";

BUNDLES.forEach((bundle) => {
    const parts = bundle.sources.map((source) => {
        const body = fs.readFileSync(path.join(ROOT, source), "utf8").trim();
        return "/* ===== " + source + " ===== */\n\n" + body + "\n";
    });

    const contents = bundle.comment.replace("%s", BANNER) +
        "/* Sources: " + bundle.sources.join(", ") + " */\n\n" +
        parts.join("\n");

    fs.writeFileSync(path.join(ROOT, bundle.out), contents);

    const kb = (Buffer.byteLength(contents) / 1024).toFixed(1);
    console.log("Wrote " + bundle.out + " (" + kb + " KB from " + bundle.sources.length + " files)");
});

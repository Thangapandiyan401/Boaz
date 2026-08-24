#!/usr/bin/env node
/* ============================================================================
   Writes the image manifest into the markup.

   Finds every <img data-asset="key"> across the site and fills in src,
   srcset, sizes, width, height and alt from tools/images.js. Attributes
   already present in the markup (class, loading, decoding, a custom alt)
   are preserved, so the HTML stays the place where layout decisions live
   and the manifest stays the place where image sources live.

       node tools/apply-images.js          # rewrite
       node tools/apply-images.js --check  # report only, non-zero if stale

   ========================================================================= */

const fs = require("fs");
const path = require("path");
const manifest = require("./images.js");

const ROOT = path.join(__dirname, "..");
const SKIP_DIRS = new Set(["node_modules", "tools", ".git", "assets"]);
const checkOnly = process.argv.includes("--check");

function htmlFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : htmlFiles(full);
        return entry.name.endsWith(".html") ? [full] : [];
    });
}

function parseAttributes(tag) {
    const attributes = {};
    const pattern = /([a-zA-Z0-9-]+)(?:\s*=\s*"([^"]*)")?/g;
    let match;

    /* Skip the tag name itself. */
    pattern.lastIndex = 4;

    while ((match = pattern.exec(tag)) !== null) {
        attributes[match[1]] = match[2] === undefined ? "" : match[2];
    }

    return attributes;
}

function escapeAttribute(value) {
    return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/* Ordered so the generated markup reads consistently everywhere. */
const ATTRIBUTE_ORDER = [
    "class", "data-asset", "src", "srcset", "sizes",
    "width", "height", "alt", "loading", "decoding", "fetchpriority"
];

function serialise(attributes) {
    const keys = Object.keys(attributes).sort((a, b) => {
        const ai = ATTRIBUTE_ORDER.indexOf(a);
        const bi = ATTRIBUTE_ORDER.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const rendered = keys
        .filter((key) => attributes[key] !== null)
        .map((key) => (attributes[key] === "" && key !== "alt"
            ? key
            : key + '="' + escapeAttribute(attributes[key]) + '"'));

    return "<img " + rendered.join(" ") + ">";
}

function rewrite(html, file, report) {
    return html.replace(/<img\b[^>]*>/g, (tag) => {
        const attributes = parseAttributes(tag);
        const key = attributes["data-asset"];

        if (!key) return tag;

        if (!manifest.images[key]) {
            report.missing.push(file + " -> " + key);
            return tag;
        }

        const built = manifest.build(key);

        attributes.src = built.src;
        attributes.srcset = built.srcset;
        attributes.sizes = built.sizes;
        attributes.width = built.width;
        attributes.height = built.height;

        /* A hand-written alt in the markup wins: it can be more specific to
           the page than the shared description in the manifest. */
        if (!attributes.alt) attributes.alt = built.alt;

        return serialise(attributes);
    });
}

const report = { changed: [], missing: [] };

htmlFiles(ROOT).forEach((file) => {
    const original = fs.readFileSync(file, "utf8");
    const updated = rewrite(original, path.relative(ROOT, file), report);

    if (updated === original) return;

    report.changed.push(path.relative(ROOT, file));
    if (!checkOnly) fs.writeFileSync(file, updated);
});

report.missing.forEach((line) => console.error("Unknown image key: " + line));

if (checkOnly) {
    if (report.changed.length) {
        console.error("Stale image markup in:\n  " + report.changed.join("\n  "));
        process.exit(1);
    }
    console.log("All image markup is up to date.");
} else {
    console.log(report.changed.length
        ? "Updated " + report.changed.length + " file(s):\n  " + report.changed.join("\n  ")
        : "No changes needed.");
}

if (report.missing.length) process.exit(1);

#!/usr/bin/env node
/* ============================================================================
   Keeps the shared chrome identical across every page.

   Each page marks the regions it shares with the rest of the site:

       <!-- @head -->  ... <!-- /@head -->
       <!-- @header --> ... <!-- /@header -->
       <!-- @footer --> ... <!-- /@footer -->
       <!-- @modal -->  ... <!-- /@modal -->

   This script replaces whatever sits between those markers with the matching
   file from tools/partials, rewriting {{ROOT}} to the relative path back to
   the site root so the pages work from the file system as well as a server.

       node tools/sync-layout.js
       node tools/sync-layout.js --check

   ========================================================================= */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PARTIALS = path.join(__dirname, "partials");
const SKIP_DIRS = new Set(["node_modules", "tools", ".git", "assets"]);
const REGIONS = ["head", "header", "footer", "modal"];
const checkOnly = process.argv.includes("--check");

const partials = REGIONS.reduce((all, name) => {
    all[name] = fs.readFileSync(path.join(PARTIALS, name + ".html"), "utf8").trim();
    return all;
}, {});

function htmlFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : htmlFiles(full);
        return entry.name.endsWith(".html") ? [full] : [];
    });
}

/* "" for index.html, "../" for pages/about.html, and so on. */
function relativeRoot(file) {
    const depth = path.relative(ROOT, path.dirname(file)).split(path.sep).filter(Boolean).length;
    return "../".repeat(depth);
}

/* Indent the partial to match the marker so the output stays readable. */
function indent(block, width) {
    const pad = " ".repeat(width);
    return block.split("\n").map((line) => (line ? pad + line : line)).join("\n");
}

/* Deliberately a plain string search rather than a built regular expression:
   the markers are fixed text, and "<!-- @head -->" cannot be confused with
   "<!-- @header -->" because the closing " -->" has to match too. */
function replaceRegion(html, name, rootPath) {
    const open = "<!-- @" + name + " -->";
    const close = "<!-- /@" + name + " -->";
    const body = partials[name].replace(/\{\{ROOT\}\}/g, rootPath);

    let result = html;
    let from = 0;

    for (;;) {
        const start = result.indexOf(open, from);
        if (start === -1) break;

        const end = result.indexOf(close, start);
        if (end === -1) break;

        /* Whatever sits between the start of the line and the marker is the
           indentation the generated block should adopt. */
        const lineStart = result.lastIndexOf("\n", start) + 1;
        const lead = result.slice(lineStart, start);
        const width = /^[ \t]*$/.test(lead) ? lead.length : 0;

        const block = open + "\n" + indent(body, width) + "\n" + " ".repeat(width) + close;

        result = result.slice(0, start) + block + result.slice(end + close.length);
        from = start + block.length;
    }

    return result;
}

function applyRegions(html, rootPath) {
    return REGIONS.reduce((current, name) => replaceRegion(current, name, rootPath), html);
}

const changed = [];
const missing = [];

htmlFiles(ROOT).forEach((file) => {
    const original = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file);

    REGIONS.forEach((name) => {
        if (!original.includes("<!-- @" + name + " -->")) missing.push(rel + " has no @" + name + " marker");
    });

    const updated = applyRegions(original, relativeRoot(file));

    if (updated === original) return;

    changed.push(rel);
    if (!checkOnly) fs.writeFileSync(file, updated);
});

missing.forEach((line) => console.error("Warning: " + line));

if (checkOnly) {
    if (changed.length) {
        console.error("Out-of-date layout in:\n  " + changed.join("\n  "));
        process.exit(1);
    }
    console.log("Shared layout is up to date.");
} else {
    console.log(changed.length
        ? "Synced " + changed.length + " file(s):\n  " + changed.join("\n  ")
        : "No changes needed.");
}

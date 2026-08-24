#!/usr/bin/env node
/* ============================================================================
   Static audit of the built pages. Checks the things that quietly rot on a
   hand-maintained static site:

     - internal links and anchors that point nowhere
     - missing or duplicate <title>, meta description, canonical
     - images without alt text or without width/height
     - pages with no <h1>, or more than one
     - heading levels that skip a step
     - duplicate element ids

       node tools/audit.js
   ========================================================================= */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SKIP_DIRS = new Set(["node_modules", "tools", ".git", "assets"]);
const problems = [];

function htmlFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : htmlFiles(full);
        return entry.name.endsWith(".html") ? [full] : [];
    });
}

const files = htmlFiles(ROOT);
const pages = files.map((file) => ({
    file: file,
    rel: path.relative(ROOT, file).split(path.sep).join("/"),
    html: fs.readFileSync(file, "utf8")
}));

const idsByPage = new Map();

pages.forEach((page) => {
    const ids = (page.html.match(/\sid="([^"]+)"/g) || []).map((m) => m.slice(5, -1));
    idsByPage.set(page.rel, new Set(ids));

    const seen = new Set();
    ids.forEach((id) => {
        if (seen.has(id)) problems.push(page.rel + ": duplicate id \"" + id + "\"");
        seen.add(id);
    });
});

function report(page, message) {
    problems.push(page.rel + ": " + message);
}

pages.forEach((page) => {
    const { html, rel } = page;

    /* --- head essentials --- */
    const titles = html.match(/<title>([\s\S]*?)<\/title>/g) || [];
    if (titles.length !== 1) report(page, titles.length + " <title> tags");

    if (!/<meta name="description" content="[^"]{40,}"/.test(html)) {
        report(page, "missing or very short meta description");
    }

    const noindex = /name="robots"[^>]*noindex/.test(html);
    if (!noindex && !/<link rel="canonical"/.test(html)) report(page, "missing canonical");

    /* --- headings --- */
    const h1s = html.match(/<h1[\s>]/g) || [];
    if (h1s.length !== 1) report(page, h1s.length + " <h1> elements");

    const levels = (html.match(/<h([1-6])[\s>]/g) || []).map((m) => Number(m[2]));
    for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) {
            report(page, "heading jumps from h" + levels[i - 1] + " to h" + levels[i]);
            break;
        }
    }

    /* --- images --- */
    (html.match(/<img\b[^>]*>/g) || []).forEach((tag) => {
        if (!/\salt="/.test(tag)) report(page, "img without alt: " + tag.slice(0, 70));
        if (!/\swidth="/.test(tag) || !/\sheight="/.test(tag)) {
            report(page, "img without width/height: " + tag.slice(0, 70));
        }
    });

    /* --- internal links --- */
    (html.match(/\shref="([^"]+)"/g) || []).forEach((raw) => {
        const href = raw.slice(7, -1);

        if (/^(https?:|mailto:|tel:|#)/.test(href)) {
            if (href.startsWith("#") && href !== "#" && !idsByPage.get(rel).has(href.slice(1))) {
                report(page, "anchor not found on page: " + href);
            }
            return;
        }

        const [target, hash] = href.split("#");
        const resolved = path.normalize(path.join(path.dirname(page.file), target));

        if (!fs.existsSync(resolved)) {
            report(page, "broken link: " + href);
            return;
        }

        if (hash) {
            const targetRel = path.relative(ROOT, resolved).split(path.sep).join("/");
            const targetIds = idsByPage.get(targetRel);
            if (targetIds && !targetIds.has(hash)) {
                report(page, "link to missing anchor: " + href);
            }
        }
    });
});

/* --- duplicate titles and descriptions across the site --- */
["<title>([\s\S]*?)</title>", '<meta name="description" content="([^"]*)"'].forEach((pattern, i) => {
    const label = i === 0 ? "title" : "description";
    const seen = new Map();

    pages.forEach((page) => {
        const match = page.html.match(new RegExp(pattern));
        if (!match) return;
        const key = match[1].trim();
        if (seen.has(key)) problems.push("duplicate " + label + ": " + seen.get(key) + " and " + page.rel);
        else seen.set(key, page.rel);
    });
});

console.log("Audited " + pages.length + " pages.");
if (!problems.length) {
    console.log("No problems found.");
} else {
    console.log(problems.length + " problem(s):");
    problems.forEach((p) => console.log("  - " + p));
    process.exit(1);
}

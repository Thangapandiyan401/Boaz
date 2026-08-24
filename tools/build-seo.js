#!/usr/bin/env node
/* ============================================================================
   Generates robots.txt and sitemap.xml from the pages that actually exist,
   so the sitemap cannot drift out of step with the site.

       node tools/build-seo.js

   Pages carrying <meta name="robots" content="noindex"> are left out.
   Change SITE below if the production domain changes.
   ========================================================================= */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = "https://www.workbridge.com.au";
const SKIP_DIRS = new Set(["node_modules", "tools", ".git", "assets"]);

/* Rough priority by section — the home page first, legal pages last. */
const PRIORITY = [
    [/^index\.html$/, "1.0", "weekly"],
    [/^pages\/(businesses|workers|industries|how-it-works|contact)\.html$/, "0.9", "monthly"],
    [/^industries\//, "0.8", "monthly"],
    [/^pages\/(about|faq|resources|blog)\.html$/, "0.7", "monthly"],
    [/^blog\//, "0.6", "monthly"],
    [/^pages\/(privacy|terms|cookies)\.html$/, "0.3", "yearly"]
];

function htmlFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : htmlFiles(full);
        return entry.name.endsWith(".html") ? [full] : [];
    });
}

function classify(url) {
    const match = PRIORITY.find(([pattern]) => pattern.test(url));
    return match ? { priority: match[1], changefreq: match[2] } : { priority: "0.5", changefreq: "monthly" };
}

const today = new Date().toISOString().slice(0, 10);

const urls = htmlFiles(ROOT)
    .map((file) => ({ file: file, url: path.relative(ROOT, file).split(path.sep).join("/") }))
    .filter((page) => {
        const html = fs.readFileSync(page.file, "utf8");
        return !/name="robots"[^>]*noindex/.test(html);
    })
    .sort((a, b) => Number(classify(b.url).priority) - Number(classify(a.url).priority) ||
        a.url.localeCompare(b.url));

const entries = urls.map((page) => {
    const meta = classify(page.url);
    const loc = page.url === "index.html" ? SITE + "/" : SITE + "/" + page.url;

    return [
        "    <url>",
        "        <loc>" + loc + "</loc>",
        "        <lastmod>" + today + "</lastmod>",
        "        <changefreq>" + meta.changefreq + "</changefreq>",
        "        <priority>" + meta.priority + "</priority>",
        "    </url>"
    ].join("\n");
});

fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.join("\n") + "\n</urlset>\n");

fs.writeFileSync(path.join(ROOT, "robots.txt"),
    "# robots.txt for " + SITE + "\n" +
    "User-agent: *\n" +
    "Allow: /\n\n" +
    "# Build tooling and source partials are not content\n" +
    "Disallow: /tools/\n\n" +
    "Sitemap: " + SITE + "/sitemap.xml\n");

console.log("Wrote sitemap.xml with " + urls.length + " URLs, and robots.txt");

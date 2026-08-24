# WorkBridge — flexible staffing website

A static marketing website for a fictional staffing brand, **WorkBridge**, built
with HTML, CSS and vanilla JavaScript. No frameworks, no build step required to
view it, no backend.

Open `index.html` in a browser and it works, including from the file system.

---

## What this is

22 pages: a homepage, section pages for businesses and workers, an industries
listing plus five industry detail pages, how-it-works, about, contact, FAQ,
resources, a blog with three articles, three legal pages and a 404.

**There is no backend.** Nothing on this site authenticates a user, stores a
record or sends a message:

- **Log in** opens an informational modal explaining that accounts are not live.
- **Get started** links to the contact page.
- The **contact form** validates on the client, then swaps in a success panel.
  Nothing is transmitted. `sendEnquiry()` in `js/forms.js` is the single place
  to wire up a real endpoint.

Statistics shown on the homepage and about page are **illustrative placeholders**
and are marked with an HTML comment where they appear. Replace them with the
client's verified figures before launch.

Testimonials are original placeholder copy attributed to job titles rather than
named individuals, so nothing needs retracting when real quotes arrive.

---

## Running it

Double-clicking `index.html` works. For a closer match to production, serve the
folder over HTTP:

```bash
npx serve .
# or
python -m http.server 8000
```

Node is only needed for the maintenance scripts in `tools/`, never to view the
site.

---

## Project structure

```
.
├── index.html
├── 404.html
├── robots.txt                 generated
├── sitemap.xml                generated
│
├── pages/                     about, businesses, workers, how-it-works,
│                              industries, contact, faq, resources, blog,
│                              privacy, terms, cookies
├── industries/                hospitality, events, retail, logistics, healthcare
├── blog/                      article-1, article-2, article-3
│
├── css/
│   ├── variables.css          design tokens
│   ├── reset.css
│   ├── base.css               typography, focus, small utilities
│   ├── layout.css             container, sections, header, nav, footer
│   ├── components.css         buttons, cards, forms, accordion, modal
│   ├── sections.css           hero, industries, testimonials, CTA, blog
│   ├── animations.css         keyframes and scroll-reveal states
│   ├── responsive.css         breakpoint overrides
│   └── site.css               GENERATED bundle - the pages load only this
│
├── js/
│   ├── utils.js               selectors, focus trap, scroll lock
│   ├── navigation.js          sticky header, dropdowns, mobile drawer
│   ├── faq.js                 accordion
│   ├── modal.js               modal with focus trap
│   ├── animations.js          IntersectionObserver reveals, counters
│   ├── forms.js               validation and the submit hook
│   ├── main.js                entry point
│   └── site.js                GENERATED bundle - the pages load only this
│
├── assets/
│   ├── icons/favicon.svg
│   ├── images/og-home.png     social share card
│   └── fonts/                 empty; for self-hosting a webfont later
│
└── tools/                     maintenance scripts, not part of the site
    ├── partials/              head, header, footer, modal
    ├── build-assets.js        css/js modules -> site.css, site.js
    ├── sync-layout.js         partials -> every page
    ├── images.js              image manifest
    ├── apply-images.js        manifest -> img markup
    ├── build-seo.js           robots.txt and sitemap.xml
    └── audit.js               links, headings, metadata, alt text
```

---

## The two generated files

`css/site.css` and `js/site.js` are **concatenations** of the modules listed
above. The pages request one stylesheet and one script instead of fifteen files.

The modules are the source of truth. After editing anything in `css/` or `js/`:

```bash
node tools/build-assets.js
```

Both generated files carry a "do not edit directly" banner. Nothing is minified,
so the source stays readable in a browser's dev tools; gzip on the server does
the compression.

---

## Shared header and footer

Every page contains the same header, footer and modal markup inline. That is
deliberate: it keeps the pages fast, indexable and working without JavaScript.

To avoid editing 22 files by hand, the shared regions are marked:

```html
<!-- @header -->  ... generated ...  <!-- /@header -->
```

Edit `tools/partials/header.html` (or `head`, `footer`, `modal`), then:

```bash
node tools/sync-layout.js
```

The script rewrites that region in every page and adjusts `{{ROOT}}` to the
relative path back to the site root, so pages nested in `pages/`, `industries/`
and `blog/` all get correct links.

`node tools/sync-layout.js --check` exits non-zero if any page is out of date,
which is useful in CI.

**The active navigation link is not hard-coded.** `navigation.js` compares each
link against the current URL at runtime, so the header markup stays identical
everywhere.

---

## Images and the Cloudinary path

No image URL is written by hand in the HTML. Every photograph is described once
in `tools/images.js`:

```js
"industry-hospitality": {
    id: "photo-1414235077428-338989a2e8c0",
    alt: "Wait staff carrying a plated dish through a busy restaurant",
    type: "fluid", width: 800, height: 500, sizes: "(min-width: 940px) 32vw, 92vw"
}
```

The markup only references the key:

```html
<img data-asset="industry-hospitality" loading="lazy" decoding="async">
```

Then:

```bash
node tools/apply-images.js
```

fills in `src`, `srcset`, `sizes`, `width`, `height` and `alt`. Run it with
`--check` to verify the markup matches the manifest without writing.

`width` and `height` are always emitted so images reserve their space and do not
shift the layout as they load. Below-the-fold images are lazy-loaded; the hero
uses no photograph at all, so the largest element on first paint is text.

### Moving to Cloudinary

Set one constant in `tools/images.js`:

```js
const CLOUDINARY_CLOUD = "your-cloud-name";
```

and re-run `node tools/apply-images.js`. URLs are rewritten through Cloudinary
**fetch** mode, which proxies and transforms the existing remote files, so
nothing has to be uploaded on day one:

```
https://res.cloudinary.com/<cloud>/image/fetch/f_auto,q_auto,c_fill,w_800,h_500/<original-url>
```

`f_auto` serves WebP or AVIF where the browser supports it. To move to uploaded
assets later, change `remoteUrl()` in the same file - it is the only function
that knows where images live.

### Replacing the placeholder photography

The current photographs are Unsplash images under the Unsplash License, chosen
as relevant placeholders. Swap the `id` values in the manifest for the client's
own photography (or local paths) and re-run the script. Alt text lives in the
manifest too, so it travels with the image.

---

## The tools

```bash
node tools/build-assets.js     # rebuild css/site.css and js/site.js
node tools/sync-layout.js      # push partials into every page
node tools/apply-images.js     # write the image manifest into the markup
node tools/build-seo.js        # regenerate robots.txt and sitemap.xml
node tools/audit.js            # check links, headings, metadata, alt text
```

`audit.js` is the one to run before handing anything over. It checks for broken
internal links and anchors, missing or duplicate titles, descriptions and
canonicals, images without alt text or dimensions, pages with the wrong number
of `h1` elements, heading levels that skip a step, and duplicate element ids.

The sitemap is built from the files that actually exist and skips anything marked
`noindex`, so it cannot drift out of step with the site.

---

## Before it goes live

1. **Domain.** Every canonical, Open Graph and JSON-LD URL uses
   `https://www.workbridge.com.au`. Replace it across the HTML, then update
   `SITE` in `tools/build-seo.js` and re-run that script.
2. **Statistics.** Replace the placeholder figures on the homepage and about
   page. Both are marked with an HTML comment.
3. **Contact details.** The phone number, email and street address on the
   contact page are placeholders.
4. **Social links.** The three URLs in `tools/partials/footer.html` point at
   plausible but non-existent profiles. Update them and re-run
   `sync-layout.js`, or remove the list.
5. **Legal pages.** Privacy, terms and cookie policies are starting templates
   and say so on the page. They need review by a qualified adviser.
6. **The contact form.** Connect `sendEnquiry()` in `js/forms.js` to a real
   endpoint, then remove the note under the submit button telling visitors the
   form is not connected.
7. **Testimonials.** Replace with real quotes once they are approved.

### A note on FAQ structured data

`FAQPage` schema is on `pages/faq.html` only, generated from the same data that
renders the accordion so the two cannot disagree. It is deliberately **not** on
the homepage FAQ: Google now limits FAQ rich results to authoritative government
and health sites, so duplicating the markup would add weight for no benefit.

---

## Design tokens

Colour, type scale, spacing, radius, shadow and motion all live in
`css/variables.css`. Changing the brand colour is one line:

```css
--brand-500: #2f6bee;   /* primary */
```

Type sizes use `clamp()` and grids use `auto-fit`, so most of the layout adapts
without a media query. `css/responsive.css` only holds the changes those cannot
express - chiefly the header switching to a drawer below 992px and the hero
composition unstacking at 940px.

**Fonts.** No webfont is loaded. The stack lists Inter first and falls back to
the platform UI font, which means zero font requests, no layout shift and no
flash of unstyled text. To use Inter, self-host it into `assets/fonts/` and add
an `@font-face` block - the stack already names it.

---

## Accessibility

- Skip link to `#main` on every page.
- One `h1` per page and no skipped heading levels, both enforced by `audit.js`.
- The mobile drawer and the modal trap focus, close on `Escape` and on an
  outside click, lock background scrolling, and return focus to the element that
  opened them.
- Collapsed accordion panels and drawer sub-menus are marked `inert`, so their
  content stays out of the tab order and the screen-reader flow while still
  being able to animate open.
- Interactive elements are real `button` and `a` elements with `aria-expanded`,
  `aria-controls` and `aria-current` maintained in JavaScript.
- Visible focus rings, minimum 40px tap targets, decorative images with empty
  `alt`, decorative SVGs with `aria-hidden`.
- `prefers-reduced-motion: reduce` shows all content immediately and removes
  the reveals, the floating cards and the logo marquee, which becomes a tidy
  wrapped block of logos rather than a scrolling strip.

---

## Browser support

Current Chrome, Edge, Firefox and Safari. The features with the newest baseline
are `inert` (Safari 15.5+) and animated `grid-template-rows` for the accordion
and drawer sub-menus, which degrades to an instant open rather than breaking.

`body` uses `overflow-x: hidden` rather than the newer `overflow-x: clip`. That
is deliberate: `clip` does not clip `position: fixed` descendants, so the closed
off-canvas drawer would leave the page scrollable sideways by a few pixels.

JavaScript fails soft. `main.js` starts each module in its own `try` block, so a
fault in one feature cannot take down the rest of the page, and a broken image is
replaced with a neutral placeholder rather than leaving a broken-image icon in
the layout.

---

## What was verified

- All 22 pages load with no console errors.
- No horizontal overflow on any page at 360, 375, 390, 414, 480, 768, 834, 1024,
  1280, 1440 or 1920px, measured with real browser window sizes.
- `audit.js` reports no broken links, anchors, headings or metadata problems.
- Mobile drawer, drawer sub-menus, FAQ accordion and login modal all verified
  for open, close, `Escape`, `inert` and focus behaviour.
- Contact form verified for required-field errors, email and phone format
  messages, focus moving to the first invalid field, and the success path.
- Scroll reveals and the counting statistics verified with animation enabled and
  with `prefers-reduced-motion: reduce`.

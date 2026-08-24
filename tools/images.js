/* ============================================================================
   Central image manifest.

   Every photograph on the site is described once, here. The HTML never
   contains a hand-written image URL: mark an <img> with data-asset="<key>"
   and run `node tools/apply-images.js` to write src, srcset, sizes, width,
   height and alt into the markup.

   Moving to Cloudinary later is a one-line change: set CLOUDINARY_CLOUD to
   the cloud name and re-run the script. Cloudinary fetch mode proxies the
   existing remote files, so nothing has to be re-uploaded on day one.

   The photographs are Unsplash placeholders under the Unsplash License and
   are meant to be swapped for the client's own photography.
   ========================================================================= */

const SOURCE_ORIGIN = "https://images.unsplash.com/";

/* Set to the cloud name, e.g. "workbridge", once Cloudinary is in play. */
const CLOUDINARY_CLOUD = null;

const QUALITY = 70;

/* Candidate widths for fluid images, filtered per image below. */
const WIDTHS = [480, 768, 1024, 1440];

/* --- The manifest --------------------------------------------------------
   type   "fluid" scales with the layout, "fixed" renders at one size
   crop   "face" centres the crop on a face, used for portraits
   sizes  the CSS `sizes` attribute for fluid images
   ------------------------------------------------------------------------ */

const images = {
    "business-team": {
        id: "photo-1600880292203-757bb62b4baf",
        alt: "Two colleagues celebrating at a desk after filling a shift request",
        type: "fluid", width: 960, height: 640, sizes: "(min-width: 940px) 46vw, 92vw"
    },
    "planning-session": {
        id: "photo-1552664730-d307ca884978",
        alt: "Operations team planning a staffing roster around a whiteboard",
        type: "fluid", width: 960, height: 640, sizes: "(min-width: 940px) 46vw, 92vw"
    },
    "team-laptops": {
        id: "photo-1522071820081-009f0129c71c",
        alt: "Team working together on laptops around a shared table",
        type: "fluid", width: 960, height: 640, sizes: "(min-width: 940px) 46vw, 92vw"
    },
    "office-space": {
        id: "photo-1497366754035-f200968a6e72",
        alt: "Open plan office with glass partitioned meeting rooms",
        type: "fluid", width: 960, height: 640, sizes: "(min-width: 940px) 46vw, 92vw"
    },

    "industry-hospitality": {
        id: "photo-1414235077428-338989a2e8c0",
        alt: "Wait staff carrying a plated dish through a busy restaurant",
        type: "fluid", width: 800, height: 500, sizes: "(min-width: 940px) 32vw, 92vw"
    },
    "industry-events": {
        id: "photo-1505373877841-8d25f7d46678",
        alt: "Audience seated in front of a large stage screen at a conference",
        type: "fluid", width: 800, height: 500, sizes: "(min-width: 940px) 32vw, 92vw"
    },
    "industry-retail": {
        id: "photo-1441986300917-64674bd600d8",
        alt: "Clothing displayed on open shelving inside a retail store",
        type: "fluid", width: 800, height: 500, sizes: "(min-width: 940px) 32vw, 92vw"
    },
    "industry-logistics": {
        id: "photo-1553413077-190dd305871c",
        alt: "Stacked pallet racking running down a warehouse aisle",
        type: "fluid", width: 800, height: 500, sizes: "(min-width: 940px) 32vw, 92vw"
    },
    "industry-healthcare": {
        id: "photo-1576091160399-112ba8d25d1d",
        alt: "Healthcare worker in a white coat checking notes on a phone",
        type: "fluid", width: 800, height: 500, sizes: "(min-width: 940px) 32vw, 92vw"
    },
    "industry-customer-service": {
        id: "photo-1556740738-b6a63e27c4df",
        alt: "Team member serving a customer at a counter payment terminal",
        type: "fluid", width: 800, height: 500, sizes: "(min-width: 940px) 32vw, 92vw"
    },
    "industry-manufacturing": {
        id: "photo-1581091226825-a6a2a5aee158",
        alt: "Production worker operating equipment on a manufacturing line",
        type: "fluid", width: 800, height: 500, sizes: "(min-width: 940px) 32vw, 92vw"
    },
    "industry-horticulture": {
        id: "photo-1591857177580-dc82b9ac4e1e",
        alt: "Raised garden beds planted with leafy greens and herbs",
        type: "fluid", width: 800, height: 500, sizes: "(min-width: 940px) 32vw, 92vw"
    },
    "industry-venue": {
        id: "photo-1566073771259-6a8506099945",
        alt: "Poolside deck and open-air restaurant at a resort venue",
        type: "fluid", width: 800, height: 500, sizes: "(min-width: 940px) 32vw, 92vw"
    },

    "post-rosters": {
        id: "photo-1454165804606-c3d57bc86b40",
        alt: "Manager reviewing a printed roster beside two laptops",
        type: "fluid", width: 800, height: 450, sizes: "(min-width: 940px) 32vw, 92vw"
    },
    "post-briefing": {
        id: "photo-1542744173-8e7e53415bb0",
        alt: "Team gathered around a table for a shift briefing",
        type: "fluid", width: 800, height: 450, sizes: "(min-width: 940px) 32vw, 92vw"
    },
    "post-peak": {
        id: "photo-1505373877841-8d25f7d46678",
        alt: "Large seated audience filling an event space",
        type: "fluid", width: 800, height: 450, sizes: "(min-width: 940px) 32vw, 92vw"
    },

    "person-amara":  { id: "photo-1544005313-94ddf0286df2",  alt: "", type: "fixed", crop: "face", width: 44, height: 44 },
    "person-daniel": { id: "photo-1507003211169-0a1dd7228f2d", alt: "", type: "fixed", crop: "face", width: 44, height: 44 },
    "person-priya":  { id: "photo-1438761681033-6461ffad8d80", alt: "", type: "fixed", crop: "face", width: 44, height: 44 },
    "person-marcus": { id: "photo-1472099645785-5658abf4ff4e", alt: "", type: "fixed", crop: "face", width: 44, height: 44 },
    "person-leila":  { id: "photo-1573497019940-1c28c88b4f3e", alt: "", type: "fixed", crop: "face", width: 44, height: 44 },
    "person-tomas":  { id: "photo-1560250097-0b93528c311a",  alt: "", type: "fixed", crop: "face", width: 44, height: 44 },
    "person-heidi":  { id: "photo-1494790108377-be9c29b29330", alt: "", type: "fixed", crop: "face", width: 44, height: 44 },
    "person-owen":   { id: "photo-1519085360753-af0119f7cbe7", alt: "", type: "fixed", crop: "face", width: 44, height: 44 }
};

/* --- URL building --------------------------------------------------------- */

function remoteUrl(entry, width, height) {
    const params = ["auto=format"];

    if (entry.crop === "face") {
        params.push("fit=facearea", "facepad=2.6");
    } else {
        params.push("fit=crop");
    }

    params.push("w=" + width, "h=" + height, "q=" + QUALITY);

    return SOURCE_ORIGIN + entry.id + "?" + params.join("&");
}

/* Cloudinary fetch mode wraps the existing remote URL, so switching over
   does not require re-uploading a single file. */
function cdnUrl(entry, width, height) {
    const source = remoteUrl(entry, width, height);

    if (!CLOUDINARY_CLOUD) return source;

    const transform = ["f_auto", "q_auto", "c_fill", "w_" + width, "h_" + height].join(",");

    return "https://res.cloudinary.com/" + CLOUDINARY_CLOUD +
        "/image/fetch/" + transform + "/" + encodeURIComponent(source);
}

function scaledHeight(entry, width) {
    return Math.round(width * (entry.height / entry.width));
}

function build(key) {
    const entry = images[key];
    if (!entry) throw new Error("Unknown image key: " + key);

    let srcset;

    if (entry.type === "fixed") {
        /* Rendered size never changes, so a retina pair is enough. */
        srcset = [
            cdnUrl(entry, entry.width, entry.height) + " 1x",
            cdnUrl(entry, entry.width * 2, entry.height * 2) + " 2x"
        ].join(", ");
    } else {
        srcset = WIDTHS
            .filter((width) => width <= entry.width * 2)
            .map((width) => cdnUrl(entry, width, scaledHeight(entry, width)) + " " + width + "w")
            .join(", ");
    }

    return {
        src: cdnUrl(entry, entry.width, entry.height),
        srcset: srcset,
        sizes: entry.sizes || null,
        width: entry.width,
        height: entry.height,
        alt: entry.alt
    };
}

module.exports = { images: images, build: build };

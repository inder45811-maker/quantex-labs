# Quantex Labs

A static, multi-page research-material catalog with a local Three.js DNA illustration and progressive enhancement. The site is published through Sites under the existing project ID in `.openai/hosting.json`.

## Build and check

Requires Node.js; no dependency installation is needed for the website.

```sh
node scripts/build-site.mjs
node scripts/build-dna-fallback.mjs
node scripts/verify-source.mjs
```

`dist/` is the published output. `content/catalog.json` is the only catalog source. Edit product records there and rebuild instead of editing the generated HTML. Shared behavior and styles live in `dist/app.js`, `dist/motion.js`, `dist/dna-loader.js`, `dist/dna-helix.js` and `dist/styles.css`.

## Current release status

This is a private catalog preview. Ordering is not open. All sample pages explicitly use `noindex,follow`, and the sitemap excludes preview URLs. Native Sites access controls are managed separately from these files.

Before a sales launch:

1. Add the official HTTPS WhatsApp or Telegram group invitation in `content/site.json`.
2. Replace sample catalog records with confirmed names, strengths, formats, prices, currency, availability and supporting documentation. Set `confirmed` only for verified listings.
3. Supply and publish the actual business contact information and ordering, delivery, returns, privacy and other applicable site policy content. The confirmation flag is a launch gate, not a substitute for publishing those pages.
4. Review the content and audience for the intended public launch. The rebuild preserves the existing private audience.
5. Update preview-specific page copy and metadata to reflect the final approved catalog. Then set `mode` to `live`, rebuild, rerun source/browser checks and publish through the Sites workflow.

The builder blocks live mode when required invitations, catalog fields or business confirmation are missing. It validates invitation hosts and rejects unsafe URL schemes. This does not verify that an invite is active or that a product is lawfully available; confirm the real supplied information before launch.

## Browser verification

The release audit checks 12 normal routes plus a real 404 response, four screen widths, contrast and automated WCAG AA rules, keyboard menu controls, search/filter states, compound enquiry context, reduced motion, no-JavaScript navigation and catalog rendering, failed-module recovery, and WebGL context loss. See `reports/production-audit.md` and the JSON evidence. Automated accessibility testing is supplemented by interaction and visual checks; it is not a certification.

## Search and answer-engine preparation

Every route has a distinct title, description, canonical, one main heading, visible crawlable content and appropriate JSON-LD. FAQ schema matches visible answers, and breadcrumbs connect product pages to the catalog. No availability, purity, certifications, reviews or offers are fabricated. There is no SEO/AEO/GEO certification or guaranteed ranking claimed.

## Motion and rendering

Pages use progressive scroll reveals, staggered entrances, card interaction and FAQ transitions. Native page transitions are used where supported. Content and navigation remain usable when JavaScript is disabled. Reduced-motion preferences suppress decorative motion and stop automatic DNA rotation. The DNA renderer stops its animation loop when paused and settled, hidden or offscreen. A matching static diagram remains visible until the renderer is ready; WebGL failure uses an interactive 2D renderer where available.

## Licenses

Space Grotesk is self-hosted with its OFL license in `dist/assets/fonts/OFL.txt`. Three.js is local and retains its MIT license in `dist/vendor/THREE-LICENSE.txt`. No analytics, tracking scripts or third-party fonts are loaded by this build.

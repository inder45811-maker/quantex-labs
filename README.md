# Quantex Labs

A static, multi-page research-material catalog with a local Three.js DNA illustration and progressive enhancement. The complete source and its previous history are preserved here.

## GitHub Pages

Website: https://inder45811-maker.github.io/quantex-labs/

Every push to `main` builds, verifies and deploys the site with `.github/workflows/deploy-pages.yml`. The workflow deploys only the generated `pages-dist/` artifact, with directory routes and the correct base path. It uses GitHub's deployment token and does not require a personal token in repository secrets.

```sh
node scripts/build-github-pages.mjs
```

The output is ignored because it is reproducible from the committed source. The workflow reads the deployment origin and base path from GitHub Pages settings, supporting a future custom domain. The retained `.openai/hosting.json` identifies the earlier Sites deployment; its access controls do not protect this public GitHub Pages deployment.

## Build and check

Requires Node.js; no dependency installation is needed for the website.

```sh
node scripts/build-site.mjs
node scripts/build-dna-fallback.mjs
node scripts/verify-source.mjs
```

`dist/` is the published output. `content/catalog.json` is the only catalog source. Edit product records there and rebuild instead of editing the generated HTML. Shared behavior and styles live in `dist/app.js`, `dist/motion.js`, `dist/dna-loader.js`, `dist/dna-helix.js` and `dist/styles.css`.

## Current release status

GitHub Pages publishes a publicly reachable catalog preview. Ordering is not open. All sample pages explicitly use `noindex,follow`, and the sitemap excludes preview URLs. Noindex is an indexing instruction, not an access control.

Before a sales launch:

1. Add the official HTTPS WhatsApp or Telegram group invitation in `content/site.json`.
2. Replace sample catalog records with confirmed names, strengths, formats, prices, currency, availability and supporting documentation. Set `confirmed` only for verified listings.
3. Supply and publish the actual business contact information and ordering, delivery, returns, privacy and other applicable site policy content. The confirmation flag is a launch gate, not a substitute for publishing those pages.
4. Review the content for the intended sales launch. GitHub Pages is already publicly reachable.
5. Update preview-specific page copy and metadata to reflect the final approved catalog. Then set `mode` to `live`, rebuild, rerun source/browser checks and push to `main`.

The builder blocks live mode when required invitations, catalog fields or business confirmation are missing. It validates invitation hosts and rejects unsafe URL schemes. This does not verify that an invite is active or that a product is lawfully available; confirm the real supplied information before launch.

## Browser verification

The original Sites release audit checks 12 normal routes plus a real 404 response, four screen widths, contrast and automated WCAG AA rules, keyboard menu controls, search/filter states, compound enquiry context, reduced motion, no-JavaScript navigation and catalog rendering, failed-module recovery, and WebGL context loss. See `reports/production-audit.md` and the JSON evidence for that historical release. Pages-specific URL, route, asset and metadata checks are recorded in `reports/pages-verification.json`. Automated accessibility testing is supplemented by interaction and visual checks; it is not a certification.

## Search and answer-engine preparation

Every route has a distinct title, description, canonical, one main heading, visible crawlable content and appropriate JSON-LD. FAQ schema matches visible answers, and breadcrumbs connect product pages to the catalog. No availability, purity, certifications, reviews or offers are fabricated. There is no SEO/AEO/GEO certification or guaranteed ranking claimed.

## Motion and rendering

Pages use word-mask heading reveals, staggered entrances with depth, pointer-reactive specimen highlights, card tilt, magnetic buttons, a sliding filter outline and animated FAQ answers. Native page transitions and shared compound-to-detail morphs are used where supported. The complete DNA model has a cinematic arrival and reacts to scrolling and pointer movement without changing its accepted geometry. Content and navigation remain usable when JavaScript is disabled. Reduced-motion preferences suppress decorative motion and stop automatic DNA rotation. The DNA renderer stops its animation loop when paused and settled, hidden or offscreen. A matching static diagram remains visible until the renderer is ready; WebGL failure uses an interactive 2D renderer where available.

## Licenses

Space Grotesk is self-hosted with its OFL license in `dist/assets/fonts/OFL.txt`. Three.js is local and retains its MIT license in `dist/vendor/THREE-LICENSE.txt`. No analytics, tracking scripts or third-party fonts are loaded by this build.

# Quantex Labs production review

Historical review of the original Sites release before the GitHub Pages migration. The GitHub Pages website is publicly reachable. Its deployment-specific verification is recorded in `pages-verification.json` and `pages-browser.json`; current hosting instructions are in the README.

Reviewed: 2 October 2026. Scope: the existing Quantex Labs Site, its 12 normal pages and 404 page, catalog/enquiry flows, accessible presentation, motion and DNA renderer. The midnight navy, teal and ice palette, typography, monogram, navigation, specimen cards and page layout establish a distinct Quantex identity.

## Release status

**Technical preview ready. Sales launch pending.** The rebuilt site remains a private preview. Orders are unavailable until the official invitation, confirmed catalog and business information are supplied. Preview pages use `noindex,follow`; no sample URL is included in the sitemap. The publication preserves the Site's existing private audience.

## Problems found and fixed

| Finding | Change |
| --- | --- |
| Home catalog vanished without JavaScript | All six cards and product links are generated in HTML; filtering enhances the same cards. |
| Purchase actions looped to the current page | Product enquiries use a contact route with compound context. Missing invitations show an explicit unavailable state. |
| Inconsistent product information across pages | One catalog source generates listings and dedicated compound pages. |
| Unsafe or malformed invitation URLs could break behavior | Build and browser code validate HTTPS official group hosts and reject unsupported schemes. |
| Sample badges disappeared on mobile | Sample status remains visible at every screen width. |
| Mobile navigation lacked a reliable keyboard path | Progressive navigation, Escape closing, focus restoration, outside-click closing and skip links are shared across all pages. |
| Small text failed contrast checks | Teal text was darkened, specimen labels improved and the DNA instruction received an opaque background. |
| Empty search and filtering lacked clear feedback | A live result count, empty state and filter reset are provided. |
| Duplicate FAQ schema and inconsistent page metadata | One FAQ node matches visible answers; unique metadata, canonical links, breadcrumbs, favicon and font are shared. |
| 3D module failure could leave an empty hero | A matching static DNA diagram remains visible until successful rendering. |
| WebGL context loss had no recovery | Context loss switches to the interactive 2D renderer and releases WebGL resources. |
| Paused/offscreen DNA kept an animation loop alive | Frames stop when paused and settled, offscreen or hidden; input and visibility resume rendering. |
| Excessive fixed GPU settings | Moderate geometry, adaptive pixel ratio, default GPU preference and smaller desktop shadows preserve the accepted helix silhouette. |
| Tablet DNA could overlap a CTA | A two-column grid keeps the visual and text in their own areas. |
| Stale assets could survive content changes | Asset versions are computed from configuration, catalog and runtime/style contents. |
| Generic browser error for missing routes | A branded 404 page is configured with actual not-found handling. |

## Verification evidence

- The final core audit passed **86 checks**, with **0 automated WCAG AA violations**, **2 gradient/outline groups requiring manual review**, **0 failures** and **0 TODOs**. Exact results are in `browser-audit.json`. Both manual-review groups were checked against their bounded background colors: all nine text/background combinations exceed 4.5:1 (minimum 5.15:1). See `manual-motion-contrast.json`.
- Checks cover all 12 routes, four screen widths (320, 390, 768 and 1440 pixels), automated WCAG AA rules, metadata, internal links, real 404 response, menu keyboard/focus behavior, catalog filtering/search/empty states, enquiry context, DNA drag/pause/reset, reduced motion, no-JavaScript catalog/navigation, blocked module and WebGL context loss.
- Paused rendering was instrumented to measure actual frame requests and callbacks during a settled idle interval.
- `source-verification.json` records 13 generated pages, 50 parsed structured-data nodes, seven real build-gate checks and asset sizes. Unsafe invitations are rejected in isolated build fixtures; the live build is rejected while launch data is missing.
- The motion audit passed **37 checks**, with **0 failures** and **0 TODOs**, including entrances and reveals, FAQ opening/closing/rapid toggles/keyboard use, native FAQ behavior without JavaScript, filters, DNA keyboard rotation and reduced-motion behavior. See `motion-audit.json`.
- The new interactive-motion audit passed **20 checks** with **0 failures**, bringing browser checks to **143**. It verifies word-mask text preservation, four-width layouts, pointer card tilt/highlights, magnetic buttons, filter-indicator movement, unique shared compound transitions, real DNA scroll/pointer events, paused/offscreen scheduling and reduced-motion manual controls. See `interactive-motion.json`.
- Fresh-context local measurements recorded home LCP **0.752 seconds**, catalog LCP **1.120 seconds**, and initial-load CLS **0** on both routes. These are unthrottled headless Chrome observations with software WebGL. They are not mobile field scores or a production Core Web Vitals assessment.
- No unexpected runtime errors, failed resources or external HTTP requests were observed. Total static asset gzip size is approximately **262 KiB**; 3D code is loaded on the home page only.
- Desktop and mobile screenshots were visually inspected. The accepted double-helix geometry is preserved: two continuous spiralling rails and 24 paired rungs.
- The production error log checked during the review contained no error events. This is an observed log result, not a guarantee of future uptime.

Automated accessibility checks do not certify accessibility. Local Chrome tests use software WebGL and do not represent every physical device or network. Estimated gzip sizes are not deployed transfer measurements. Native deployment success verifies publication; it does not replace real-user performance monitoring after public launch.

## Motion across the site

Headings reveal through word masks; supporting text and cards enter in staggered sequences with stronger depth. Desktop cards tilt toward the pointer and catch a moving highlight, while action buttons subtly follow the pointer. A sliding outline tracks the active catalog filter. FAQ answers animate height and content; mobile navigation links enter in sequence. Supported native page transitions combine fades, depth and a directional reveal, with a selected compound specimen morphing into its detail panel.

The accepted DNA geometry arrives as a complete object with a cinematic rotation and scale transition. Scrolling changes its angle and scale; pointer movement affects its tilt and lighting. Pausing freezes passive effects, while manual drag and keyboard controls remain available. Animation scheduling stops when the scene is settled, hidden or offscreen. Reduced motion suppresses decorative entrances, pointer effects, page transitions and automatic rotation. Content stays visible and navigable when enhancement is unavailable.

## Search, AEO and GEO preparation

Dedicated URLs, visible static content, descriptive headings, titles and descriptions, canonical links, breadcrumbs, organization/site schema and FAQ answers provide the search foundation. Preview restrictions must be removed only for approved, public launch content. There is no certification or ranking guarantee.

Google's [AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide?version=published) applies the usual search fundamentals to its AI features. Its [noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing?missing=undefined) explains why a crawler must be allowed to read a page's noindex directive. The preview therefore allows crawling in robots.txt while marking the HTML noindex.

## Remaining launch inputs

1. **Official invitation:** an active WhatsApp or Telegram group URL.
2. **Confirmed catalog:** actual product names, strengths, supplied formats, availability, prices, currency and supporting records. Remove sample status only for confirmed records.
3. **Business and policy content:** business contact information and actual ordering, delivery, returns, privacy and other applicable site policies. Publish and review that content before confirming the business gate.
4. **Public launch preparation:** review the final copy, approved audience and public indexable routes. Update preview-specific language, set live mode, rebuild, rerun the checks and publish.

No purity percentages, testing results, manufacturing certifications, reviews, stock or pricing were invented.

# Portfolio Sections and Résumé Sync

Status: Approved in visual review on 2026-07-15

## Context

The immersive project stages are specified separately in `2026-07-15-project-stage-redesign-design.md`. This specification completes the surrounding portfolio: content synchronization, Skills, Education, Identity, Experience, Contact, and the global cursor grammar.

The supplied `Yousof_Selim_Resume_Final_2027_Internship(2)(1).pdf` is the sole content source of truth. The portfolio must not preserve older roles, skill groupings, dates, or summaries that conflict with that résumé.

## Goals

- Synchronize all portfolio facts with the July 2026 résumé.
- Preserve the landing-page dotted figure and its scroll-driven resolution into the Identity photograph.
- Give Skills, Education, Identity, Experience, Projects, and Contact clearly different structures while retaining one authored portfolio system.
- Keep information readable and interactions discoverable without turning sections into repeated card grids.
- Replace the broken Contact composition with a stable, responsive closing statement.
- Preserve and enhance the context-reactive cursor without harming native interaction, accessibility, or performance.

## Shared Visual System

The non-project sections use the portfolio's near-black, cream, muted sage, and restrained warm-neutral palette. Distinction comes from composition and behavior rather than unrelated color schemes:

- Skills is kinetic and horizontal.
- Education is editorial and chapter-based.
- Identity is photographic and asymmetrical.
- Experience is a campaign calendar.
- Contact is a typographic sign-off.

Typography continues to pair a bold condensed/extended display sans, an expressive italic serif, and a compact monospaced metadata face. Fine rules, small archive labels, and generous negative space remain consistent across sections.

## Dark and Light Theme System

- Dark mode remains the default authored experience.
- A persistent header control switches the full portfolio between dark and light modes and exposes its current state to assistive technology.
- The choice persists locally and may respect the operating-system preference on a first visit, but a user choice always wins.
- Light mode restyles the landing shell, navigation, Selected Work archive, Skills, Education, Identity/About, Experience, Contact, footer, controls, rules, text, and loading states—not only the page background.
- Identity/About follows the active global theme. Its registered photograph and dotted reveal may retain a locally darkened image treatment for contrast, but the section surface, typography, rules, metadata, and decorative type all become light in light mode.
- The Selected Work archive follows the global theme, but an opened project stage retains its approved project-specific palette. Light mode must not recolor Bupples, Adelante, Photoshoot, or Fallen Asteri internally.
- Project-stage entry temporarily hands the themed archive surface into the fixed project palette; closing reverses that handoff back into the current global theme.
- Theme changes interpolate surface, text, rule, and muted colors smoothly without flashing, resetting scroll position, restarting section animations, or interrupting an open interaction.
- Every theme meets WCAG AA contrast and is verified at the supported responsive widths.

Contact remains structurally distinctive through typography, ruled space, draggable email text, and cursor behavior. Its background stays close to the surrounding portfolio surface in both modes. Sage appears only as a restrained accent/glow; Contact must not alternate into another dominant green field.

## Portfolio-Wide Experience and Motion System

The redesign is an overall portfolio polish pass, not a set of isolated section replacements. Navigation, loading, scrolling, section handoffs, interactive states, responsiveness, and visual rhythm must improve together.

### Initial Loading Experience

- Never show a blank page while JavaScript or large media initializes.
- Render the background, name/wordmark, navigation shell, and a lightweight loading mark immediately.
- Use a short authored sequence based on the portfolio's dots, ruled lines, and typography: the mark resolves, the name arrives, and the landing composition opens.
- The sequence reflects real readiness rather than delaying the site artificially. It may wait for critical landing/Identity assets, but it has a hard timeout and releases the page even if a noncritical asset fails.
- Target approximately 700–1100 ms on a normal first visit and a much shorter return/cached visit.
- The loader exits into the first landing animation without a white flash, layout jump, or separate visual language.
- Scroll and primary navigation remain safely locked only while necessary; focus is never trapped on decorative loader content.
- Reduced motion uses an immediate shell plus a brief opacity reveal.

### Section Handoffs

Avoid applying the same generic fade-up to every section. Each section reveals according to its structure while sharing one timing and easing vocabulary:

- Landing uses the existing dotted figure and type assembly.
- Projects expand from archive rows into their landscape stages.
- Skills enters as moving horizontal bands whose motion is already in progress.
- Education uses an editorial chapter/page wipe.
- Identity receives the landing figure and develops it into the photograph.
- Experience draws the calendar rules and resolves campaign markers.
- Contact builds from the headline baseline, then opens the email rule and links.

Transitions should overlap slightly so the outgoing section hands color, line, or motion into the next section instead of stopping completely before the next begins. Use scroll progress and CSS custom properties for shared accent/background interpolation where helpful, while keeping content legible at all intermediate states.

Color continuity is explicit rather than incidental: the first color stop of each section matches the final surface of the preceding section, then eases into that section's own surface over a shallow boundary ramp. No section relies on a transparent background that can expose an unrelated body color. Identity hands its themed surface into Experience; Experience hands its themed surface through a restrained neutral bridge into Contact; Contact resolves back into the page/footer surface. These ramps become shorter on narrow screens so they do not consume the composition.

### Interactive State Quality

Every actionable element receives a complete state set:

- rest;
- hover on fine pointers;
- keyboard focus;
- pressed/active;
- selected where applicable;
- disabled/busy where applicable;
- completion or error feedback where an action has an outcome.

Microinteractions follow the same response rhythm:

- immediate input acknowledgment in roughly 60–120 ms;
- primary movement settling in roughly 220–420 ms;
- longer authored project actions only where the interaction needs a visible narrative;
- smooth `cubic-bezier(.16, 1, .3, 1)`-style settling rather than abrupt linear motion.

Hover states must not shift surrounding layout. Press states use small transform, color, line, or depth changes rather than unrelated decorative effects. Keyboard focus receives the same visual quality as hover, not a browser-default afterthought.

### Motion Orchestration

- Use one small motion controller for visibility, reduced-motion state, and section activation.
- Intersection observers start and pause below-the-fold ambient motion.
- Pointer motion is batched through requestAnimationFrame.
- Repeated clicks, rapid stage changes, and interrupted transitions cannot leave controls locked, invisible, or in an impossible state.
- Animation cleanup runs when a project closes, a section leaves view, or the document becomes hidden.
- Progressive enhancement keeps the document readable and navigable before motion initializes or when it fails.

### Overall Portfolio Polish

- Normalize the spacing rhythm between all sections without making their layouts identical.
- Refine fluid typography so display titles remain expressive without compression, clipping, or awkward wrapping.
- Improve header/navigation contrast, active-section feedback, and anchor behavior.
- Preserve scroll position and focus through project stage openings/closings.
- Use intentional image loading states that preserve layout dimensions.
- Remove stale copy, duplicated controls, debug labels, prototype approval UI, and effects that do not explain the work.
- Ensure the final Contact ending feels conclusive rather than like another project panel.

## Résumé and Content Synchronization

### Download

- Replace the production `Yousof-Selim-Resume.pdf` with the newly supplied résumé.
- All résumé links use the stable repository filename rather than the original Downloads filename.
- The résumé action must download or open the current file successfully from the deployed site.
- Remove stale copies from user-facing links; temporary preview servers and Downloads paths must never reach production.

### Summary

The Identity introduction reflects the résumé summary:

> Software Engineering student graduating in 2027 with 3+ years of experience building and shipping mobile, web, and desktop products across iOS, Android, web, and Windows.

Supporting copy may be shortened for layout, but it must retain the emphasis on sole-developer ownership, cross-platform delivery, native integrations, backend architecture, testing, and end-to-end shipping.

### Experience Source of Truth

The Experience & Leadership section contains one role:

- Digital Marketing Executive
- Sunway Cybersecurity Club
- Subang Jaya, Malaysia
- January 2026–present

Do not retain Freelance Software Engineer as a separate Experience entry. Freelance/sole-developer credibility remains visible through the summary and projects.

## Skills

### Structure

Skills uses six continuously moving horizontal lanes rather than a static grid or card wall. Every lane has a compact category label and an infinitely looping sequence of its skills.

The exact groups and content are:

1. **Languages:** Dart, TypeScript, JavaScript, Python, SQL, HTML/CSS
2. **Mobile & Frontend:** Flutter, Riverpod, Swift/SwiftUI, Kotlin, WidgetKit, Android RemoteViews, Electron, WebGL2
3. **Backend & Data:** Firebase, Firestore, Cloud Functions, Node.js, REST APIs, Supabase/PostgreSQL
4. **Cloud, AI & Services:** Vertex AI, Gemini, MediaPipe, RevenueCat, Remote Config, App Check
5. **Tools:** Git/GitHub, Xcode, Figma, Godot Engine
6. **Spoken Languages:** English (Fluent), Arabic (Native)

### Motion and Controls

- All six lanes auto-scroll continuously at rest.
- No lane is preselected or visually treated as active.
- Hovering or keyboard-focusing one lane pauses only that lane; the other five continue moving.
- While a lane is hovered/focused, shaded edge fades and thin directional arrows appear at its left and right edges.
- Arrows have no circular containers.
- Clicking an arrow scrolls only that lane in the requested direction.
- When hover/focus ends, that lane resumes automatically from its current position.
- Pointer-driven increments use floating-point accumulation so sub-pixel motion does not round to zero.
- Automatic movement must use immediate scroll updates; global `scroll-behavior: smooth` must not cancel per-frame motion.

### Readability and Accessibility

- Lane speed remains slow enough to read individual items.
- Category labels remain stationary.
- Hover/focus pauses provide a reliable reading state.
- Arrow controls are semantic buttons with accessible names and visible keyboard focus.
- Touch devices can pause a lane by tapping/focusing and can use the same arrows.
- Reduced motion stops automatic scrolling while retaining manual controls.

## Education

### Structure

Education uses a dark editorial chapter layout, not project-style stages and not a conventional timeline card grid. Two selectable chapter markers control one focused academic spread.

Chapters:

1. **2024–2027** — Bachelor of Software Engineering (Hons), Sunway University / Lancaster University, expected 2027, Subang Jaya, Malaysia. Relevant coursework: Software Architecture, Data Structures, Mobile Development, Databases, UI/UX Design.
2. **May 2023–July 2024** — Foundation in Information Technology, Multimedia University, Cyberjaya, Malaysia. Focus: Programming, Data Structures, Networking, and Web Fundamentals.

### Behavior

- Selecting a chapter updates the institution, qualification, dates, location, and supporting details in place.
- The transition is a restrained editorial wipe/fade, not a project-stage opening.
- The approved palette stays near-black, cream, muted sage, and warm grey so Education belongs to the portfolio.
- Both records remain fully available to keyboard and assistive technology users.

## Identity

### Composition

- The resolved photograph is deliberately smaller than the former Identity image.
- The photograph sits on the left.
- The heading, introduction, and factual facets sit on the right.
- Text must not collapse into a single left-aligned column on desktop.
- The desktop layout is asymmetric but balanced, with enough breathing room around the image and headline.
- On narrow screens, the photograph moves above the text without becoming oversized.

### Landing-to-Identity Morph

The existing landing-page dotted figure remains. Scrolling moves that figure into the Identity photograph frame, formulates the background, and then dissolves the dots into the developed photograph. The destination frame must match the new smaller left-side composition.

The morph must preserve one continuous subject:

- position, scale, and aspect ratio remain consistent between the dotted figure and developed photograph;
- no jump occurs when the destination section activates;
- the destination frame is measured after responsive layout and used as the scroll animation's docking target;
- the transition supports replay in development/QA but does not require a permanent replay control in production;
- reduced motion shows the resolved image with a short opacity transition.

### High-Resolution Photograph Registration

Use `/Users/yousofselim/Downloads/IMG_7210.jpg` as the approved high-resolution source. Production receives an optimized local derivative; it must not load from Downloads.

The dotted artwork was registered against the following crop of the 4284×5712 source:

- left: 368 px
- top: 2448 px
- width: 3010 px
- height: 2358 px

Generate a high-quality derivative from this crop so the developed photograph and `yousof-color.png` share the same effective aspect and subject geometry. Do not achieve registration by stretching the entire portrait image.

The approved display tone lowers the HDR-like exposure with approximately:

- brightness: 0.80
- saturation: 0.82
- contrast: 0.98

The original file remains untouched. The website may apply the tone non-destructively or bake an optimized derivative, provided the final result preserves highlight detail, skin tone, and image sharpness.

### Identity Content

The approved heading direction is `Software, built` with an italic `with intent.` accent. Supporting facets communicate:

- Focus: mobile and full-stack product development
- Practice: design, engineering, testing, and delivery
- Location: Subang Jaya / Kuala Lumpur
- Languages: English (fluent), Arabic (native)

## Experience & Leadership

### Composition

Experience is visualized as an authored content calendar rather than employment cards or a generic vertical timeline. A seven-column January-to-now calendar becomes the primary visual artifact, with `10+` as a restrained background/metric element.

The role title and organization remain clearly readable:

- Digital Marketing Executive
- Sunway Cybersecurity Club
- Subang Jaya · January 2026–present

### Campaign Interaction

The calendar includes at least ten small campaign markers across four categories:

- recruitment;
- industry visits;
- awards;
- event recaps.

Compact filters highlight one category while de-emphasizing the others. Filters are semantic toggle buttons, keyboard accessible, and do not hide the résumé copy.

The accompanying description states that Yousof planned 10+ LinkedIn posts/campaign assets, coordinated the content calendar, produced graphics in Canva, and collaborated with the committee and external partners.

### Responsive Behavior

- The calendar may horizontally scroll on narrow screens with a visible cue.
- Role metadata moves above or below the calendar rather than overlapping it.
- The `10+` decoration never obscures text or controls.

## Contact

### Composition

Contact is a stable typographic sign-off. Remove the rejected image-filled `HELLO` composition and any large contact portrait.

The section includes:

- availability: full-time internship, January–April 2027;
- location: Subang Jaya / Kuala Lumpur, Malaysia;
- headline: `Let's build` with italic `something memorable.`;
- primary email: `yousofselim2@gmail.com`;
- copy-email control;
- GitHub, LinkedIn, and résumé links;
- a small designed-and-built-by-hand sign-off.

### Interaction

- Pointer movement may reposition one soft sage radial glow.
- Hovering/focusing the email line creates a restrained horizontal light sweep.
- The email is bare typography rather than a boxed card. On pointer or touch drag it moves only within a small bounded range, tilts subtly, and springs back with the shared easing; a normal click without a drag still opens the mail action.
- The copy control writes the email to the clipboard and reports `Copied`; if clipboard access fails, it opens a mail action or otherwise exposes the address.
- The email remains a real `mailto:` link.
- The composition remains readable and functional without pointer movement or JavaScript.

### Responsive Stability

- The headline and email use fluid type sizes with tested minimums.
- Long email text may wrap only at safe break opportunities and must not overflow horizontally.
- Social links and sign-off stack cleanly on narrow screens.
- No absolutely positioned contact photograph or decorative word may determine the section's height.

## Global Cursor Grammar

- Preserve the portfolio's reactive cursor on fine-pointer devices.
- At rest, the portfolio cursor is a spacious, low-opacity dotted orbit with a small center point and no persistent explanatory label. The dots are especially restrained in light mode so the cursor does not read as visual noise.
- When an actionable element is hovered, grabbed, or pressed, the orbit expands into a solid action badge and centers a short verb inside it, such as `OPEN`, `COPY`, `DRAG`, `FILTER`, `RENDER`, or the destination theme name.
- The action badge uses the inverse theme value: warm light fill with near-black text in dark mode, and near-black fill with warm light text in light mode. Project stages may map this inverse pair to their own palette while preserving contrast.
- The fill, label, and scale settle as one continuous medium-speed transition: the solid disc grows beneath the fading orbit, then the label resolves near the center. Target roughly 300–380 ms with an authored ease so the fill feels elegant but never delays interaction. Pressing compresses the badge without shifting the target; leaving restores the dotted orbit and hides the label.
- The cursor changes accent and treatment as project stages become active.
- Over Fallen Asteri it becomes the approved refined pixel sword with an accurate hotspot; the separate slash trail remains removed.
- Over standard links, buttons, text, forms, and non-project sections, cursor behavior remains restrained and never hides interaction semantics.
- Native cursor behavior remains on coarse pointers, reduced-motion configurations, and whenever the replacement cannot initialize reliably.
- Cursor rendering uses one requestAnimationFrame loop and transform-only updates.

Fallen Asteri enemies use authored pixel-art sprites with crisp nearest-neighbor rendering, consistent outline weight, distinct silhouettes, and bounded death/respawn effects. They must look native to the game vignette rather than like CSS blobs.

## Accessibility

- Heading order remains logical across all sections.
- All content-changing controls are semantic buttons and expose current state.
- Focus styles remain visible against dark surfaces.
- Auto-scrolling Skills content respects reduced motion and pauses for interaction.
- Identity images have concise descriptive alternative text; decorative dot layers are hidden from assistive technology.
- Experience filters do not remove the underlying résumé information.
- Contact links have descriptive labels and usable touch targets.
- Color is never the sole indicator of active state.
- Loader and section transitions never block content longer than necessary or create keyboard traps.
- All essential information remains available when animation is disabled.

## Performance and Asset Handling

- Copy the approved résumé and source assets into stable repository paths.
- Generate optimized WebP/AVIF/JPEG derivatives with explicit dimensions.
- Preserve the 3010×2358 registered Identity crop as the high-quality source derivative and serve smaller responsive variants where useful.
- Lazy-load below-the-fold images while preloading only the landing/Identity assets required for the scroll morph.
- Pause requestAnimationFrame loops and observers when elements are offscreen or the document is hidden.
- Avoid layout reads inside per-frame pointer loops.
- Keep the existing static HTML/CSS/JavaScript architecture unless a specific requirement proves impossible without a dependency.

## Acceptance Criteria

- The portfolio résumé download is the newly supplied July 2026 résumé.
- Summary, Skills, Education, Projects, Experience, availability, and contact information match that résumé.
- Skills contains all six exact résumé groups, every lane auto-scrolls, only the hovered/focused lane pauses, and edge arrows manually scroll that lane.
- Education uses the approved two-chapter editorial layout and portfolio-matched palette.
- Identity uses a smaller left-side photograph and right-side text on desktop.
- Identity/About fully adopts the light palette in light mode while retaining the local photograph contrast needed by the dotted reveal.
- The landing dotted figure docks into that frame without a position or scale jump.
- The developed photograph uses a crisp registered derivative of `IMG_7210.jpg`, with reduced exposure and geometry matching the dotted artwork.
- Experience contains only the Sunway Cybersecurity Club Digital Marketing Executive role and uses the interactive content-calendar composition.
- Contact uses the rebuilt typographic sign-off and remains stable at all supported widths.
- The reactive cursor remains available, project-aware, accessible, and performant; actionable hover states expand into inverse-theme filled badges with concise centered action labels.
- Fallen Asteri uses the refined sword cursor and coherent pixel-art enemies with no separate slash trail.
- The initial loading sequence is visually authored, tied to actual readiness, bounded by a timeout, and exits without flashes or layout shifts.
- Section entrances and handoffs are structurally distinct, smooth, and consistent with the shared motion grammar.
- Every interactive control has polished hover, focus, pressed, and outcome states without layout shift.
- Rapid/repeated interactions do not strand the page in a transition state.
- The complete portfolio shows improved typography, spacing, navigation feedback, image loading behavior, and responsive stability rather than only redesigned sections.
- No production URL references localhost, Downloads, `tmp`, or `.superpowers` assets.
- Keyboard, touch, reduced-motion, and responsive behavior are verified.

## Non-Goals

- Adding unrelated experience entries that are absent from the supplied résumé.
- Turning non-project sections into more project stages.
- Replacing the established project designs or Education direction.
- Permanently exposing prototype controls or approval UI.
- Destructively altering the original high-resolution photograph.

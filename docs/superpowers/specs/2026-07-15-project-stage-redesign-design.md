# Project Stage Redesign

Status: Approved in visual review on 2026-07-15

## Context

The portfolio currently presents four selected projects as archive rows with a separate preview panel. The redesign keeps the authored specimen/archive identity, but makes every selected project feel like a full landscape section with its own visual voice and signature interaction.

The selected set remains four projects. The existing Task Management App is replaced by Adelante, and project facts are updated from the 2027 internship resume.

## Goals

- Make each project memorable without turning the portfolio into four unrelated websites.
- Let a project occupy nearly the full viewport when focused, like a show opening onto a stage.
- Preserve the archive navigation, typography, restrained information hierarchy, and authored feel of the existing site.
- Give every project one meaningful, playful interaction that relates to the product.
- Keep project capabilities compact and scannable.
- Make entering and leaving a project feel like one continuous spatial transition.
- Preserve responsive behavior, keyboard access, reduced-motion support, and fast loading.

## Design Principles

1. **One system, four personalities.** Every project uses the same entry, exit, metadata, capability rail, and navigation grammar. Palette, media composition, and signature interaction change per project.
2. **The project is the landscape.** A focused project is a near-viewport-height stage, not a small card inside the archive.
3. **Interaction must explain the work.** Effects should reveal a product idea—expense depth, forward movement, capturing a photo, or defeating an enemy—not exist as decoration alone.
4. **Motion preserves place.** Opening a project grows from its archive row; closing it returns to the same row and scroll position.
5. **Restraint wins.** Each project receives one primary interactive centerpiece plus a small capability rail. Supporting motion stays quiet.

## Information Architecture

The Selected Work section begins with the existing archive heading and four compact project rows:

1. Bupples
2. Photoshoot
3. Adelante
4. Fallen Asteri

Each row is an accessible button or link-like control that opens its corresponding project stage. Only one stage can be active at a time. The persistent portfolio header and a clear close/back control remain available while a stage is open.

Each project stage contains:

- project number and category;
- title and concise case summary;
- date, role, platform, and status where useful;
- one interactive media composition;
- a four-item capability rail with icons;
- the appropriate external action, if one exists;
- stage navigation/back behavior.

## Shared Entry and Exit Transition

### Opening

1. The selected archive row receives focus/active styling.
2. Its background and accent color spread outward to become the project stage.
3. The row title and project number travel into their stage positions rather than disappearing and reappearing.
4. The neighboring rows soften and move out of the viewport.
5. Project media and the capability rail resolve after the background and title settle.
6. Focus moves to the stage heading or close control, and body scrolling is constrained to the intended stage behavior.

The target duration is roughly 700–900 ms with a smooth `cubic-bezier(.16, 1, .3, 1)` curve. Secondary elements may use short, overlapping delays, but the transition should read as one movement.

### Closing

The same sequence reverses. The stage contracts back into the original archive row, neighboring rows return, scroll position is restored, and keyboard focus returns to the control that opened the stage.

### Navigation Between Projects

Moving directly to the next or previous project first neutralizes the current stage into the shared archive surface, then resolves the next project's theme. Avoid a hard color cut between project palettes.

### Reduced Motion

When `prefers-reduced-motion: reduce` is active, stages switch with a short opacity change and no scaling, parallax, drawn paths, card throws, or combat movement. Content and controls remain fully available.

## Shared Capability Rail

Every stage ends with the same compact four-column rail. Each item pairs a simple line icon with a short label and optional one-line detail. It should be visually subordinate to the interactive centerpiece and should not become a second card grid.

On narrow screens, the rail becomes a two-column grid or horizontal scroller with a visible label; it must not clip or rely on hover.

## Project Specifications

### Bupples

#### Content

- Category: Social expense app
- Timeline: February 2026–present
- Role: Sole developer, product design through release workflows
- Platforms: iOS, Android, and web
- Core stack: Flutter, Firebase/Firestore, Cloud Functions, Vertex AI/Gemini, RevenueCat
- Summary: A social expense-sharing product with cent-exact multi-currency accounting, real-time group activity, receipt extraction, chat, subscriptions, and secure backend rules.

#### Visual Direction

Use a deep near-black/fern theme derived from the new Bupples UI, with cream typography, muted green accents, fine dotted texture, and soft green depth glows. “Bupples” must remain on one line at supported desktop widths and must never split because the title container is compressed.

#### Media Composition

Use the three supplied current UI screenshots in an overlapping phone stack:

- the profile screen is centered, largest, and visually above the others;
- the Ask Pip screen sits behind on the left;
- the custom accent screen sits behind on the right.

The complete stack is shifted slightly right to use the stage width. Its hover envelope must include enough internal padding that either side screen can pull outward without clipping.

The Ask Pip screenshot must use a deliberate crop/fit so its title, prompt options, and input remain legible and the composition does not appear accidentally cut.

#### Signature Interaction

- Pointer movement produces restrained multi-layer depth/parallax.
- Hovering a side screen pulls it slightly outward and forward.
- Hovering the center screen lifts it without separating the stack into unrelated cards.
- Touch devices use tap-to-focus or a gentle automatic settle; no information depends on hover.

Do not include the rejected “Pip is watching the pointer” copy.

#### Capability Rail

Recommended capabilities: cent-exact ledger, real-time sync, AI receipt extraction, secure cross-platform release.

#### External Actions

- Primary: `Experience it live` → `https://bupples.web.app/`
- Secondary: `View showcase` → `https://github.com/yeegz/Bupples-showcase`

### Adelante

#### Content

- Category: Widget-first motivation app
- Timeline: June 2026–present
- Role: Product, design, mobile, native widget, and backend implementation
- Platforms: iOS and Android
- Core stack: Flutter, Swift/SwiftUI and WidgetKit, Kotlin and Android RemoteViews, Firebase
- Summary: A privacy-first motivation app with Home Screen, Lock Screen, and StandBy widgets, offline content handling, scheduled delivery, strict filtering, and 80 automated tests.

#### Visual Direction

Use warm paper, dark ink, and one elegant orange accent. The Adelante wordmark remains wide, relaxed, and lower in the composition so neither the title nor the quote deck feels vertically compressed.

The large `A` is a graphic anchor. It is larger than the surrounding wordmark and leaves room for the arrow to complete its path to the right.

#### Forward Arrow Interaction

- The arrow is invisible at rest, including its caps and endpoints.
- Hovering or focusing the `A` draws an elegant orange arrow smoothly from start to finish.
- The path sits slightly right of the `A` so it feels optically centered rather than crowded inside the letter.
- The arrow has no filled interior and no pre-rendered endpoint fragments.
- The draw uses stroke-dash motion with rounded caps and a smooth ease.

The accompanying hover/focus message alternates between:

- `Adelante is Spanish for “go forward.”`
- `Even the smallest step is still forward.`

There is no permanent “Spanish — go forward” caption.

#### Quote Deck

Use a tactile stack of four unnumbered paper sheets rather than one basic quote card. The front sheet has subtle physical detail—offset layers, paper edge, typography, and a restrained shadow—without becoming ornate.

Clicking, tapping, or pressing Enter/Space discards the front sheet with a short physical motion and reveals the next quote underneath. The deck loops after the last quote. No visible card numbers are used.

#### Capability Rail

Recommended capabilities: native widgets, scheduled content pipeline, offline/privacy-first behavior, 80 automated tests.

#### External Actions

- Primary: `View showcase` → `https://github.com/yeegz/adelante-showcase`

### Photoshoot

#### Content

- Category: Desktop and browser photobooth
- Timeline: June 2026–present
- Role: Sole designer and developer
- Platforms: Windows and web
- Core stack: TypeScript, Electron, WebGL2/GLSL, MediaPipe
- Summary: A local-first photobooth with single shots, four-shot strips, video, 17 live GLSL effects, and 8 on-device face effects.

#### Visual Direction

Use a warm photographic-paper surface, charcoal interface details, and a red shutter accent. The stage should resemble a small authored desktop photo application placed on a studio sheet, not a generic product card.

#### Viewfinder Size and Composition

The camera window is intentionally smaller than the surrounding stage so the archive landscape remains visible. On desktop it occupies approximately half the stage width and sits right of the project copy. It must not return to the earlier oversized full-stage presentation.

Use the four supplied photos as the session. Each photo has its own focal position rather than sharing a generic center crop:

- shower-cap cat: face centered lower in the portrait;
- yellow-hoodie cat: crop anchored higher, around 35% vertically, so the face remains in frame;
- portrait with plush toys: crop anchored around the upper-middle face area;
- blue-eyed cat: crop anchored around the upper-middle eyes and face.

Implementation should retain per-image focal metadata so responsive crops can be tuned without editing CSS selectors for individual files.

#### Signature Interaction

- The live viewfinder responds subtly to pointer position with a focus reticle/parallax.
- Four small effect controls update the preview.
- Pressing the shutter flashes the viewfinder, captures the currently visible photo into a four-slot strip, then advances to the next supplied photo.
- Captures preserve the selected effect and the source photo's focal position.
- After four captures, the next shutter press begins a fresh strip.
- The shutter is a real button with keyboard and touch support.

#### Capability Rail

Recommended capabilities: WebGL2 pipeline, 17 real-time effects, 8 MediaPipe face effects, fully local processing.

#### External Actions

- Primary: `Experience it live` → `https://photoshoot-yeegz.web.app/`
- Secondary: `View GitHub` → `https://github.com/yeegz/photoshoot`

The primary action intentionally opens the Photoshoot web experience/landing page rather than deep-linking to `/app/`. Visitors can review the product and choose to launch the live camera app from there.

### Fallen Asteri

#### Content

- Category: 2D platformer team project
- Timeline: April–June 2024
- Role: Gameplay systems and Git/GitHub lead
- Platform: Desktop
- Core stack: Godot Engine and GDScript
- Summary: Implemented movement, combat, and scene transitions and structured the repository for team development.

#### Visual Direction

Use deep burgundy/black, dusty orange, cream pixel typography, and the existing game environment image. The game window is smaller than the stage, leaving a visible border of the portfolio world around it. It should feel like a playable vignette mounted inside the case file.

#### Signature Interaction

- Populate the game window with several lightweight pixel-art enemy types, such as a slime, bat, and eye creature.
- Replace the normal pointer over the stage with a refined pixel-art sword: outlined bright blade, gold guard, darker grip, and an accurate tip/hotspot.
- Clicking an enemy triggers its death animation, a small pixel burst, a `+35 XP` label, and a brief scene hit response.
- Do not render the rejected separate slash trail.
- Enemies respawn after a short delay at bounded positions inside the game window.
- The HUD tracks enemies cleared, XP, and level. Crossing 100 XP increments the level and shows a short level-up state.
- Clicking empty space does not create a slash effect or misleading hit feedback.

This remains a portfolio micro-interaction, not a recreation of the complete game. Enemy count and effects must be capped so repeated play cannot create unbounded DOM nodes or timers.

#### Capability Rail

Recommended capabilities: combat systems, player movement, scene/state transitions, team Git workflow.

#### External Actions

- Primary: `Play the game` → `https://yeegz.itch.io/fallenasteri`
- Secondary: `View GitHub` → `https://github.com/yeegz/Fallen-Asteri`

## Responsive Behavior

### Desktop

- Stages use near-viewport landscape proportions with copy and media sharing the width.
- Media may extend toward the edge, but all hover travel remains inside an explicit clipping-safe envelope.
- Titles use fluid sizing with tested minimum and maximum widths.

### Tablet

- Copy occupies a shorter header band and the interactive media sits below it.
- The Bupples stack reduces spread before reducing screen legibility.
- Photoshoot and Fallen Asteri retain smaller framed windows instead of filling the entire stage.

### Mobile

- Treat `360`, `390`, and `430` CSS pixels as first-class authored layouts and verify each one independently rather than relying on a single generic breakpoint.
- Each project becomes a readable vertical section rather than forcing desktop overlap.
- Bupples screens remain overlapped but use tap-to-focus and reduced depth.
- Adelante keeps the `A`, arrow focus state, and quote-deck tap behavior.
- Photoshoot keeps a compact viewfinder, full-width shutter controls, and a horizontally readable capture strip.
- Fallen Asteri retains tap targets of at least 44 CSS pixels; the decorative sword follows touch only during interaction or is replaced by a visible attack affordance.
- No title, quote, phone, photo strip, or game frame may create horizontal page scrolling.
- No mobile interaction depends on hover. Every project-specific action has an equivalent tap, focus, or visible button affordance with a minimum `44×44` CSS-pixel target.

### Stage Media Loading

- The project-colored shell and stage background appear immediately on open; media never creates a blank white or transparent frame.
- All stage images reserve intrinsic dimensions before decoding.
- A small project-colored loading mark may cover undecoded media, but it releases independently with a hard timeout and never blocks close/back navigation.
- Media decoding, project entry, and background handoff share the same easing vocabulary without delaying the stage for noncritical assets.

## Accessibility

- Archive rows and all custom interactions use semantic buttons or links.
- Every project stage has a programmatic heading and labelled close/back control.
- Quote-card discard supports click, tap, Enter, and Space.
- Shutter and filter controls expose names, selected states, and focus indicators.
- Enemies have accessible labels, but the micro-game also exposes a short instruction and an alternative external game link.
- XP and level changes use a polite live region without announcing decorative particles.
- Custom pointer effects never hide the native cursor unless a usable replacement is already rendered and the device has a fine pointer.
- Text and interactive controls meet WCAG AA contrast against each project theme.
- Reduced motion disables nonessential parallax and physical animations.
- Stages remain understandable with JavaScript disabled: project content, images, facts, and external links are still visible.

## Performance and Asset Handling

- Copy the approved user-supplied screenshots and photos into the repository; production must not reference the temporary localhost asset servers or the Downloads directory.
- Generate appropriately sized WebP/AVIF derivatives while retaining a high-quality source where useful.
- Use responsive image dimensions and lazy-load inactive project media.
- Preload only the first project stage's essential media; decode the next stage opportunistically.
- Use transforms and opacity for motion. Avoid layout-thrashing pointer handlers; update parallax through `requestAnimationFrame` and CSS custom properties.
- Pause animations, timers, and game respawns when a stage is closed or the document is hidden.
- Keep the implementation framework-free unless the existing static architecture proves insufficient; current requirements fit semantic HTML, CSS, and focused JavaScript modules.

## State Model

The project controller owns:

- active project ID or `null`;
- opening, open, closing, and idle transition state;
- opener element for focus restoration;
- reduced-motion and input-capability flags;
- cleanup callbacks for the active project's timers and listeners.

Each project interaction owns only its local state:

- Bupples: focused screen and pointer depth values;
- Adelante: quote index, discard animation lock, and hover-message variant;
- Photoshoot: current photo, captured count, selected effect, and per-photo focal data;
- Fallen Asteri: enemy instances, kills, XP, level, and respawn timers.

Opening and closing a stage resets ephemeral interaction state unless preserving it makes the return experience clearer. All timers and generated elements must be cleaned up on close.

## Error and Fallback Behavior

- If an image fails to load, retain the frame and show an intentional neutral placeholder rather than collapsing layout.
- If pointer APIs are unavailable, all controls remain usable through click/tap and keyboard.
- If custom effects fail, Photoshoot still cycles and captures unfiltered images.
- If the Fallen Asteri micro-game cannot initialize, show the static game image and the itch.io link.
- Transition locks must time out safely so a rapid open/close action cannot leave the page inert.

## Acceptance Criteria

- Task Management App is absent and Adelante appears as the third selected project.
- All four projects open into near-full landscape stages and return smoothly to their originating archive rows.
- Project stages share structure and motion grammar but are immediately distinguishable by palette, composition, and interaction.
- Bupples uses the three approved new UI screenshots in an overlapping, clipping-safe stack and keeps its title on one line.
- Adelante has the smooth orange `A` arrow, alternating forward message, and unnumbered looping quote deck.
- Photoshoot uses the four supplied photos, a deliberately smaller viewfinder, per-photo focal positions, effect controls, and shutter-driven capture/advance behavior.
- Fallen Asteri uses a smaller game frame, clickable respawning enemies, death/XP/level-up feedback, an improved pixel sword cursor, and no separate slash trail.
- Every stage includes a compact capability rail.
- Keyboard, touch, reduced-motion, and no-JavaScript fallbacks are verified.
- No project stage clips content or causes horizontal scrolling at the agreed responsive breakpoints.
- Production assets are local, optimized, dimensioned, and do not depend on temporary preview servers.

## Non-Goals

- Building a full Bupples, Adelante, Photoshoot, or Fallen Asteri product inside the portfolio.
- Giving each project a completely unrelated navigation or page shell.
- Adding large capability-card grids, decorative copy that explains cursor tracking, or permanent explanatory captions that compete with the project title.
- Replacing the overall portfolio archive identity.

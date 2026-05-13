# Skycatch GSI — Design Document

**Status:** Planning · **Owner:** Eli Kagan · **Last updated:** 2026-05-13

---

## 1. What we're building

A clickable front-end prototype of **Skycatch GSI** — the "Geospatial Intelligence" module of the Skycatch platform. The prototype is a non-functional walk-through of the GSI workspace: a single-pane interactive site twin that lets a mine operator **see** the pit, **analyze** specific data layers, **operate** live assets (drones + haul trucks), and **task** future captures — all on one map.

This is a design artifact, not a working product. **The point is to show core functionality and replace what would otherwise be a Figma file with something interactive and closer to a real product** — usable in stakeholder reviews, design discussions, and as a reference for engineering.

## 2. Context — what is Skycatch?

Skycatch is a drone automation + geospatial data platform for **mining and heavy industry**. Customers include Codelco, Caterpillar, Komatsu, Barrick, Glencore, AngloAmerican, Antamina, Kinross, Eramet, Grupo Mexico, and Hitachi. The platform automates drone-based capture of high-accuracy 3D site data and turns it into surveying, planning, and operational intelligence.

Existing Skycatch product family:
- **SkyPlan** — project planning & collaboration
- **SkyFleet** — compliance & fleet management
- **EdgeServer** — on-prem data processing
- **DataHub** — centralized analytics & site visibility
- **SkySight** — computer vision / ML insights
- **DroneMaps** — self-serve mapping

**GSI** is a new analytical module that unifies the captured data and the live operation into a single workspace. It sits on top of DataHub/SkySight outputs and adds operational awareness (live asset positions, mission tasking) to the geospatial picture.

## 3. Goals & non-goals

### Goals
- Communicate the GSI concept end-to-end via a clickable prototype
- Show how four jobs collapse into one workspace: **See / Analyze / Operate / Task**
- Demonstrate the right-side Layers panel as the core navigation device for data
- Demonstrate the bottom capture timeline as the device for time-based browsing
- Stay faithful to the existing Skycatch design language so this could plausibly ship inside the real product

### Non-goals
- No real backend, real data, or real map provider (static imagery is fine)
- No authentication, accounts, or user state
- No mobile / tablet layout in v1 — desktop only
- No accessibility audit beyond reasonable defaults

### First-class concerns (built into the DNA)
- **Light + dark mode parity.** Both themes are designed and built from day one, sharing the same tokens API with two value sets. A discrete top-bar toggle switches between them. No theme is "secondary."

## 4. Design principles

Two principles run through every screen, every component, every decision. They are not aesthetic preferences — they are constraints on the product.

### 4.1 Time is a first-class dimension

Every dataset, every layer, every analysis in GSI is tied to a specific capture date. The pit on Monday is not the pit on Friday. The product is fundamentally about **looking at the right pit at the right moment in time**, comparing moments, and scheduling future ones.

The design must constantly communicate this:
- **The capture timeline at the bottom is not decoration.** It is a permanent reminder that what you're looking at is *a moment*. It carries a date axis, capture markers, and a clear "you are here" indicator.
- **Layers carry timestamps.** Each row in the right panel shows its source capture date (e.g. *Slope Analysis 1 · 04.12.26*) — subtly, but always visible.
- **Analyses are timestamped.** KPI tiles and detail strips show "as of" dates.
- **Live assets (drones, trucks) contrast with the historical map.** State 3's callouts represent *now*, sitting on top of imagery from a past capture. That contrast is the feature, not a bug.
- **Mission config is "committing the pit to a future timeline."** Frequency + Start Time aren't just form fields — they earn weight in the layout because the user is scheduling tomorrow's pit.
- **Past / present / future use the same visual language.** A scheduled capture three days from now uses the same marker shape as a capture from last week, in a different color.

V1 doesn't need a working scrubber. It does need every surface to *show* that time matters.

### 4.2 Visual density discipline — restraint over density

Dashboards become useless when there are a million things on the screen at once. GSI carries a lot of metadata — capture dates, GSDs, pilots, payloads, battery levels, compliance percentages, layer sources, capture authorship, etc. **Most of it stays hidden by default.**

Rules:
- **On-screen by default:** only what the user is actively analyzing, plus orienting context (current site, current capture date, active layer).
- **In tooltips / hover states:** everything else. Full layer metadata, drone telemetry detail, KPI definitions, capture provenance, timestamps with seconds, etc.
- **One click of depth:** asset callouts and detail strips appear only when the user clicks a thing. They are not always-visible side rails of data.
- **Layer panel rows are slim.** Just name, eye toggle, and a subtle date stamp. Hover reveals more (source, GSD, author, full timestamp).
- **No icon clutter.** Icons earn their placement. If a row has an obvious meaning, don't add an icon "for clarity" — clarity comes from layout, not iconography.
- **No double-encoding.** If a piece of data is in a tooltip, don't also put it in the row. If a status is communicated by color, don't also add a text label.

When in doubt: **hide it.** The screen should feel airy at rest and rich on demand.

## 5. The four wireframe states

All four share the same shell. The differences are which panel is active and what's overlaid on the map.

### State 1 — Default map view
- Top-down ortho imagery of the pit
- Layer overlays visible: toes/crests (green), slope analysis lines (red/yellow), boundaries (blue/yellow)
- Layers panel on right shows all available layers with eye-toggle visibility
- Capture timeline at bottom shows multi-capture history with marker pins
- **Entry state for the prototype.**

### State 2 — Slope Analysis 1 detail
- Tilted 3D view of same pit
- Bottom panel slides up showing analysis KPIs:
  - Road Compliance: **87%** (green)
  - Steepest Slope: **5.6%** (amber)
  - Flattest Slope: **0.2%**
  - Segment cross-section graph below
- Triggered by clicking "Slope Analysis 1" in the Layers panel
- Mirrors the existing "Sample Haul Road Analysis" detail screen

### State 3 — Live operations awareness
- 3D oblique view of pit
- Live asset callouts on the map:
  - **Drone ID** — Status: Mission Execution · Battery: 48% · Pilot / Details buttons
  - **Truck ID** — LiDAR Update / Surface Update / Measure / Inspect buttons
- Demonstrates how operating drones and haul trucks appear as clickable entities on the same canvas as the analysis layers

### State 4 — New mission / capture config
- Left panel becomes a mission configuration form:
  - Mission name (free text)
  - Payload (LiDAR Mission — dropdown)
  - Priority (Medium — dropdown)
  - Frequency (Daily) + Start Time
  - Ground sampling distance
  - **Save Mission** primary CTA (green)
- Target area drawn as a blue polygon on the map (the AOI)
- Triggered by clicking "+ New Capture" in the top-right of the map
- Mirrors the existing "Configure Mission" screen

## 6. Click-through flow

```
[State 1: Default]
   ├─ click "Slope Analysis 1" in Layers → [State 2]
   ├─ click a drone/truck on map → [State 3]
   └─ click "+ New Capture" → [State 4]

From any state: click logo or "GSI" tab → back to [State 1]
```

Minimal but enough to demonstrate every job in the workspace.

## 7. Information architecture

### Top nav (horizontal, all states)
`Logo` · **GSI** · Simulation · Reports · Operations · Connections

Only **GSI** is active/explorable. Others are visible but inert.

### Left icon rail (vertical, all states)
- `+` (new — opens a small menu, mostly decorative)
- Map
- Dataset
- Analyze
- Survey
- Settings
- Account (anchored to bottom)

Only the relevant icons highlight per state; clicks are limited.

### Right rail — Layers panel (all states)
A scrollable list of data layers, each with an eye-icon visibility toggle:
- Toes & Crests
- AHS Design
- Dig Face
- Width Analysis
- Slope Analysis 1
- Boundary 1
- Boundary 2
- Orthophoto
- Terrain
- Basemap

Plus a `+` button at the top of the panel to add a new layer (decorative).

### Bottom — Capture timeline
A horizontal strip of capture markers (colored pins on a date axis). Scrubbable visually but not functional. Communicates: "every state of this pit is browsable through time."

### Map area
Center canvas. Background image of an open-pit mine (`MineBG.png`) with SVG overlays for layer linework, polygons, and asset callouts. No real map tiles.

## 8. Design language

Pulled from the existing Skycatch product (see `ExistingSkycatch_designLanguage/` reference images). Captured here so the prototype is self-contained and can be reused as a tokens source.

### 8.1 Mode

Light and dark mode are **both first-class**. They share the same semantic token names and component code. Only the values differ. A discrete toggle in the top bar (sun / moon Material icon) switches the active theme. Default on first load: dark. User preference persists in `localStorage`.

Implementation: `[data-theme="dark"]` and `[data-theme="light"]` on `<html>` swap the CSS custom-property values. All component CSS references tokens only — never raw hex.

### 8.2 Color tokens

Every visual token has a dark and a light value. Components reference tokens; tokens swap with theme.

**Surfaces**
| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg-base` | `#141416` | `#fafafa` | App background |
| `--bg-elevated` | `#1c1c1f` | `#ffffff` | Cards, panels |
| `--bg-raised` | `#242429` | `#f4f4f6` | Hovered / selected surfaces |
| `--border-subtle` | `#2a2a2f` | `#e5e5e8` | Default 1px borders |
| `--border-strong` | `#3a3a42` | `#d4d4d8` | Emphasized borders |
| `--overlay-scrim` | `rgba(0,0,0,.6)` | `rgba(0,0,0,.4)` | Modal scrim |

**Text**
| Token | Dark | Light | Use |
|---|---|---|---|
| `--text-primary` | `#ffffff` | `#0a0a0c` | H1, key data, active nav |
| `--text-secondary` | `#b8b8c0` | `#3a3a42` | Body copy |
| `--text-muted` | `#7a7a82` | `#6e6e78` | Inactive nav, secondary labels |
| `--text-dim` | `#52525a` | `#a0a0a8` | Field labels above inputs |

**Brand & semantic**
| Token | Value (approx) | Use |
|---|---|---|
| `--brand` | `#2ea3ff` | Skycatch cyan-blue. Primary buttons, active state, focus ring, selected pills |
| `--positive` | `#22c55e` | "Save Mission" CTA, compliance pass, healthy KPI |
| `--warning` | `#eab308` | Borderline analysis values, amber overlay strokes |
| `--danger` | `#ef4444` | Failed compliance, red overlay strokes |
| `--info` | `#3b82f6` | Informational overlays |

**Map overlay convention** (translucent fill + saturated stroke)
| Color | Stroke | Fill |
|---|---|---|
| Green | `#22c55e` | `rgba(34,197,94,.18)` |
| Red | `#ef4444` | `rgba(239,68,68,.18)` |
| Amber | `#eab308` | `rgba(234,179,8,.18)` |
| Brand blue | `#2ea3ff` | `rgba(46,163,255,.18)` |

### 8.3 Typography
- **Font family:** Inter (UI), with system fallback. Mono fallback for technical values: `'SF Mono', 'Fira Code', monospace`.
- **Scale:**
  - Display: 32 / 40 / -0.02em — big page titles ("Add Device Group", "Configure Mission")
  - H2: 20 / 28 — panel titles ("Slope Analysis 1", "Layers")
  - Body: 14 / 20 — default text
  - Small: 12 / 16 — labels, chip text
  - Tiny: 11 / 14 — uppercase tracking-wide field labels above inputs

### 8.4 Spacing
4px base grid. Use multiples: 4, 8, 12, 16, 20, 24, 32, 40, 56.

### 8.5 Radii
- 4px (chips, small)
- 6px (default — inputs, buttons)
- 8px (cards, panels)
- 999px (pill / circular)

### 8.6 Elevation
- **Dark mode** uses no shadow — elevation is communicated by **lighter surfaces + borders**.
- **Light mode** uses subtle shadow: `0 1px 2px rgba(0,0,0,.06)` for cards, `0 4px 16px rgba(0,0,0,.08)` for panels/dropdowns.

### 8.7 Motion
- Default transition: `150ms ease-out` for hover / active states
- Panel slide-in: `220ms cubic-bezier(.2, .8, .2, 1)`
- Subtle, never bouncy. Industrial feel.

## 9. Component inventory

Components carried from existing Skycatch app:

- **Logo mark** — Skycatch trefoil (from `SkycatchLogo.png` on Desktop)
- **Top nav bar** with org/site breadcrumb pill on left, centered nav items, avatar circle on right
- **Pill breadcrumb** — `Org. Burbridge Co. ⌄  Site. Elmwood Center ⌄`
- **Nav item** — text only; selected state = subtle outlined pill background
- **Icon rail button** — square 40×40, icon centered, active state = brand-tinted background
- **Form input (dark)** — filled rect, tiny uppercase label above
- **Select dropdown (dark)** — same as input + chevron
- **Primary button (brand)** — `--brand` fill, white text
- **Primary button (positive)** — `--positive` fill, white text, used for Save Mission
- **Ghost button** — transparent, border, text-primary
- **Avatar** — circle, single letter, subtle border
- **KPI tile** — large numeric value (colored), label below
- **Tag / chip** — pill, muted background, small icon + label

GSI-specific components (new):

- **Layers panel item** — row with label + eye toggle + drag handle
- **Capture timeline** — horizontal scroll strip with colored markers on a date axis
- **Map asset callout** — small floating card pinned to a point on the map, with action buttons inside
- **Analysis detail strip** — bottom-docked panel with KPI tiles + cross-section chart
- **Mission config form** — left-docked panel variant
- **New Capture button** — floating action button in map top-right
- **Theme toggle** — top-bar icon button, swaps `light_mode` / `dark_mode` Material icons, persists choice in `localStorage`

## 10. Icon system

**Library:** [Material Symbols Outlined](https://fonts.google.com/icons) — Google's official icon set.
- Single web font import
- Use outlined style, weight 400, fill 0, grade 0, optical size 24
- Sizes: 18px (inline), 20px (buttons), 24px (nav rail), 32px (large empty states)
- Color inherits from text

Icon mapping for the prototype:
| Component | Material symbol |
|---|---|
| `+` new | `add` |
| Map rail | `map` |
| Dataset rail | `dataset` |
| Analyze rail | `analytics` |
| Survey rail | `straighten` |
| Settings rail | `settings` |
| Account rail | `account_circle` |
| Layer visible | `visibility` |
| Layer hidden | `visibility_off` |
| Add layer | `add` |
| Org / site flag | `flag` |
| Avatar menu | `account_circle` |
| Drone callout | `flight` |
| Truck callout | `local_shipping` |
| Measure (truck) | `straighten` |
| Inspect (truck) | `search` |
| Save mission | `save` |
| Polygon tool | `polygon` |
| New capture | `add_a_photo` |

## 11. Map & imagery

- **Map background:** `MineBG.png` in the project root. Open-pit mine aerial photograph.
- **Overlays:** SVG polygons and polylines positioned absolutely over the image, with the color overlay convention from §7.2.
- **3D tilt:** Use CSS `transform: perspective() rotateX()` on the map container to fake the 3D oblique view in States 2 and 3.
- **Asset callouts:** Absolutely positioned divs with leader-line arrows (CSS triangles) pointing to map coordinates.

No real map tiles, no Mapbox, no Leaflet. Keep dependencies at zero.

## 12. Tech stack & deployment

- **Stack:** Single HTML file (`index.html`) + assets folder. No build step. No frameworks. Vanilla JS for state toggling between the four states.
- **Why:** Fast to iterate, easy to share, GitHub Pages compatible. Replaces what would otherwise be a Figma file with something interactive and closer to a real product.
- **Hosting:** GitHub Pages on `main` branch, root path.
- **Repo:** `elikagan/skycatch-gsi` (public)
- **URL:** `https://elikagan.github.io/skycatch-gsi/`
- **No password gate.**

## 13. File structure (planned)

```
Skycatch_GSI/
├── DESIGN.md                       ← this file
├── index.html                      ← the prototype
├── style.css                       ← (optional split — could inline)
├── app.js                          ← (optional split — could inline)
├── assets/
│   ├── MineBG.png                  ← already present (will move here)
│   └── SkycatchLogo.png            ← copied from Desktop
├── Screenshot_wireframes/          ← reference, not deployed
└── ExistingSkycatch_designLanguage/← reference, not deployed
```

A `.gitignore` will exclude the two reference folders from the deployed repo (or we ship them too — both fine, decide before push).

## 14. Open questions / decisions to lock

1. ~~**Dark only, or include a light-mode toggle?**~~ → **Both modes, first-class, discrete top-bar toggle.** Default dark on first load, preference persists in `localStorage`.
2. ~~**Password gate?**~~ → **No gate.**
3. ~~**Wireframe toggle?**~~ → **No.**
4. ~~**How many click-through targets per state?**~~ → **Tight (~3-4 per state), but architected so adding more is cheap.** See §15.
5. ~~**Capture timeline interactivity?**~~ → **Open/close only in v1. But time is a first-class concept across the design** — see §4.1.
6. ~~**Avatar / org name?**~~ → **Cordillera Resources** (org) · **Cerro Negro Pit** (site) · **E** (avatar initial). Invented + mining-flavored, regionally evocative (Andes — where much of Skycatch's customer base operates) without infringing on any real company.

## 15. Extensibility — adding interactivity later

The prototype ships with ~3-4 hot clicks per state, but is structured so adding more is a one-line change, not a refactor.

**Conventions:**
- **Click targets are declared in HTML via `data-action="..."` attributes.** A single document-level event-delegation listener routes them. Adding a click = add `data-action="open-slope-analysis"` to any element; no JS edit needed if the action already exists.
- **Every actionable element is already in the DOM** with the right attribute, even if its action is a no-op. To wire one up: register the action handler in `app.js`. To unwire: remove the handler. Markup stays stable.
- **State lives in one object**, e.g. `state = { scene, activeLayer, theme, captureIdx }`. Scenes are pure functions of state. Adding a new scene = add a key + a `render()` branch.
- **Layer visibility uses CSS class toggles on the map container**, e.g. `.show-toes`, `.show-slope-1`. Wiring an eye icon = `el.classList.toggle('show-toes')`. The overlays already exist in the DOM.
- **Form inputs are real `<input>` / `<select>` elements** even when Save is a no-op. Wiring them up later = read their values in the submit handler.
- **No framework lock-in.** Vanilla JS means any future engineer (or me, later) can layer in framework behavior without rewriting.

**Result:** the v1 prototype is small, but going from "demo" to "fully interactive mock" is mostly adding handlers and a bit of state, not rebuilding scenes.

## 16. Out of scope (v1)

- Real map provider integration
- Authentication
- Mobile/tablet layouts
- Light-mode parity
- Real data binding / backend
- Animations beyond simple transitions
- Multi-site / multi-org switching beyond visual breadcrumb

---

## Appendix A — Reference materials

- `Screenshot_wireframes/` — four hand-drawn wireframe screenshots from the user
- `ExistingSkycatch_designLanguage/` — eight Figma exports of existing Skycatch product screens (mix of dark and light, mission config, task list, device group form, haul road analysis, capture planner)
- `MineBG.png` — open-pit mine aerial reference image for the map canvas
- `SkycatchLogo.png` — Skycatch trefoil logo (on Desktop, will be copied into `assets/`)
- [Skycatch.com](https://skycatch.com) — company / product reference
- [Material Symbols](https://fonts.google.com/icons) — icon source

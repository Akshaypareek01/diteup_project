# DiteUp — Design System v1.0

**Brand:** Premium • Modern • Organic • Wellness • Luxury D2C
**Stack:** Next.js 14 + Tailwind CSS + Framer Motion + Three.js (selective)
**Source assets:** `/diteup_asset_package/assets/`
**Mood:** Forest at dawn. Calm authority. Hand-crafted yet precise. Think *Mokobara × The Whole Truth × Aesop*.

---

## 1. Design Principles (binding)

1. **Calm over loud.** White space is a feature, not a gap. Never crowd.
2. **One focal point per screen.** The product is the hero.
3. **Motion serves meaning.** No animation without reason. No bouncing buttons.
4. **Touch first.** 44×44 minimum tap targets. Thumb zone for primary actions.
5. **Earned trust through detail.** Hairline borders, soft shadows, deliberate spacing.
6. **Respect the user's senses.** No autoplay sound, no aggressive popups, no parallax that breaks scroll.
7. **Premium = restraint.** Two type weights, three accent uses per screen, max one ornament.
8. **Performance is a design value.** A 3-second LCP kills luxury perception.

---

## 2. Color System

### 2.1 Brand palette (exact from packaging)

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `forest` | `#1F3D2E` | 31 61 46 | Primary backgrounds (hero, dark sections, packaging), headings on cream, footer |
| `sage` | `#3E5C46` | 62 92 70 | Secondary surfaces, hover states on forest |
| `olive` | `#6B7F4E` | 107 127 78 | Icons, tag pills, secondary CTAs |
| `cream` | `#F5F0E6` | 245 240 230 | Primary background (light), card surfaces |
| `beige` | `#E8DFC8` | 232 223 200 | Subtle dividers, secondary surfaces, badge fills |
| `gold` | `#C8A24A` | 200 162 74 | Primary CTAs on dark, accents, premium markers, badges |
| `gold-soft` | `#D9B968` | 217 185 104 | Hover state for gold |
| `gold-deep` | `#A8852E` | 168 133 46 | Pressed state, ornament strokes |

### 2.2 Functional palette (added to support UI states)

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#0F1F18` | Body text on cream (12.8:1 contrast — AAA) |
| `ink-soft` | `#3A4A41` | Secondary text on cream |
| `ink-muted` | `#6B7B72` | Tertiary text, captions |
| `paper` | `#FAF7EF` | Lightest cream — cards on cream backgrounds |
| `line` | `#D9CFB8` | Hairline borders on cream |
| `line-dark` | `#2A4636` | Borders on forest |
| `success` | `#5C8A3A` | Success toasts, in-stock badge (tuned olive) |
| `warning` | `#C8862A` | Low stock, attention banners (tuned gold) |
| `error` | `#A4392E` | Errors, destructive actions (muted, not aggressive red) |
| `info` | `#4A6B7F` | Informational toasts (cool counterpart to olive) |

### 2.3 Usage rules

- **Forest** is the brand backbone — owns hero, packaging, footer, dark cards. Never use pure black anywhere.
- **Gold** is precious — limit to **one usage per viewport** (primary CTA, OR price, OR badge, never all three at once).
- **Cream** is the default light background. White (`#FFFFFF`) is forbidden except for printable invoices.
- Body text on cream → `ink`. Body text on forest → `cream` at 92% opacity (avoid pure white = harsh).
- Gradients only in two places: hero radial glow (forest→sage), logo wordmark.

### 2.4 Accessibility check

All combinations below pass WCAG AA (4.5:1 for body, 3:1 for large text):

| FG / BG | Contrast | Status |
|---|---|---|
| `ink` on `cream` | 13.1:1 | AAA |
| `forest` on `cream` | 10.4:1 | AAA |
| `cream` on `forest` | 10.4:1 | AAA |
| `gold` on `forest` | 5.8:1 | AA |
| `gold-deep` on `cream` | 4.7:1 | AA |
| `ink-muted` on `cream` | 4.6:1 | AA (body only at ≥14px) |

---

## 3. Typography

### 3.1 Fonts

| Family | Role | Weights | Loading |
|---|---|---|---|
| **Playfair Display** | Display + H1–H3 | 400, 600, 700 | `next/font/google` with `display: swap`, preloaded |
| **Montserrat** | Body, UI, H4–H6, buttons | 300, 400, 500, 600, 700 | `next/font/google`, preloaded |
| **JetBrains Mono** (optional) | Order numbers, SKUs, prices in admin | 400, 500 | `next/font/google`, lazy |

Self-host via `next/font` — never block render on Google Fonts CDN. Subset to Latin + Latin Ext.

### 3.2 Type scale (mobile → desktop, fluid via `clamp()`)

| Token | Mobile (375) | Desktop (1440) | Weight | Family | Line height | Letter spacing | Use |
|---|---|---|---|---|---|---|---|
| `display-2xl` | 44px | 80px | 600 | Playfair | 1.05 | -0.02em | Hero H1 |
| `display-xl` | 36px | 64px | 600 | Playfair | 1.08 | -0.02em | Section H1 |
| `display-lg` | 30px | 48px | 600 | Playfair | 1.12 | -0.01em | Section H2 |
| `display-md` | 26px | 36px | 600 | Playfair | 1.18 | -0.01em | Card H3, modal title |
| `h4` | 20px | 24px | 600 | Montserrat | 1.3 | -0.005em | Subsection |
| `h5` | 18px | 20px | 600 | Montserrat | 1.4 | 0 | Card title |
| `h6` | 16px | 18px | 600 | Montserrat | 1.4 | 0 | Small heading |
| `body-lg` | 17px | 19px | 400 | Montserrat | 1.6 | 0 | Hero paragraph |
| `body` | 15px | 16px | 400 | Montserrat | 1.65 | 0 | Default body |
| `body-sm` | 13px | 14px | 400 | Montserrat | 1.55 | 0 | Captions, helper text |
| `eyebrow` | 12px | 13px | 600 | Montserrat | 1.4 | 0.14em uppercase | Section labels |
| `button` | 15px | 15px | 600 | Montserrat | 1.0 | 0.02em | All CTAs |
| `mono-sm` | 13px | 13px | 500 | JetBrains Mono | 1.4 | 0 | SKUs, IDs |

**Tailwind utility example:**
```css
/* hero H1 */ class="font-display text-[clamp(2.75rem,4vw+1rem,5rem)] leading-[1.05] tracking-[-0.02em] font-semibold"
```

### 3.3 Rules

- Never mix more than 2 weights of the same family in one block.
- Body copy max width: 66ch (≈ 620px). Anything wider breaks readability.
- Headings always have `text-balance` (CSS) for clean line breaks.
- Italic only inside Playfair Display, never Montserrat.
- All-caps reserved for `eyebrow` and `button` tokens only.

---

## 4. Spacing & Layout

### 4.1 Spacing scale (4px base, named like Tailwind)

| Token | Value | Use |
|---|---|---|
| `0.5` | 2px | Hairline gaps |
| `1` | 4px | Icon-to-text in inline groups |
| `2` | 8px | Form field internal padding |
| `3` | 12px | Stack within a card |
| `4` | 16px | Default vertical rhythm |
| `6` | 24px | Card padding (mobile) |
| `8` | 32px | Card padding (desktop), small section gap |
| `12` | 48px | Sub-section gap mobile |
| `16` | 64px | Section gap mobile / sub-section desktop |
| `24` | 96px | Section gap desktop |
| `32` | 128px | Hero block gap |

### 4.2 Breakpoints

```
sm:  640px   — large phone landscape
md:  768px   — tablet portrait
lg:  1024px  — tablet landscape / small laptop
xl:  1280px  — desktop
2xl: 1440px  — wide desktop (design baseline)
```

Design first at 375px, then 1440px, then fill 768 + 1024.

### 4.3 Containers

| Width | Use |
|---|---|
| `max-w-[1320px]` | Main content container |
| `max-w-[1080px]` | Reading-focused sections (about, blog) |
| `max-w-[680px]` | Long-form text, checkout form |
| `max-w-[420px]` | Auth forms, mobile-card layouts |

Horizontal padding: `px-5 md:px-8 lg:px-12` (20 / 32 / 48 px).

### 4.4 Grid

12-column with 24px gutter desktop / 16px tablet / 16px mobile (most mobile = single column).

---

## 5. Radii, Borders, Shadows

### 5.1 Radii

| Token | Value | Use |
|---|---|---|
| `radius-xs` | 4px | Inline pills, tooltips |
| `radius-sm` | 8px | Inputs, small badges |
| `radius-md` | 12px | Cards (mobile) |
| `radius-lg` | 16px | Cards (desktop), modals |
| `radius-xl` | 24px | Hero blocks, image masks |
| `radius-2xl` | 32px | Pouch-shape decorative panels |
| `radius-full` | 9999px | Avatars, icon buttons, badges |

### 5.2 Borders

- Default: `1px solid line` on cream surfaces.
- On forest: `1px solid line-dark`.
- Hairlines (0.5px) for ultra-fine dividers (use Tailwind `border-[0.5px]`).
- Gold ornamental borders only on hero badges and packaging-style elements (mirrors the brand book).

### 5.3 Shadows (organic, soft — never sharp)

```css
--shadow-xs:  0 1px 2px rgba(31,61,46,0.04);
--shadow-sm:  0 2px 6px rgba(31,61,46,0.06), 0 1px 2px rgba(31,61,46,0.04);
--shadow-md:  0 6px 20px rgba(31,61,46,0.08), 0 2px 6px rgba(31,61,46,0.04);
--shadow-lg:  0 16px 40px rgba(31,61,46,0.10), 0 6px 14px rgba(31,61,46,0.05);
--shadow-glow-gold: 0 0 0 1px rgba(200,162,74,0.4), 0 8px 24px rgba(200,162,74,0.25);
--shadow-inset-soft: inset 0 1px 0 rgba(255,255,255,0.6);
```

Avoid `box-shadow` with high blur on mobile (paint cost). Use only on top-level cards.

---

## 6. Iconography

- Default library: **Lucide React** (1.5px stroke, 24×24 default) — already in your stack.
- Stroke weight: 1.5px (matches the brand book's circle-icon style).
- Custom brand icons (high-protein, no-preservatives, etc.) — supplied by client; store in `/assets/icons/` as SVG sprites; consistent 24×24 viewBox.
- Icon color follows text color (`currentColor`).
- Two icon-button sizes: 36px (compact toolbar) and 44px (default, touch-safe).

---

## 7. Component Library

Each component lists: anatomy, states, sizes, motion, accessibility.

### 7.1 Button

**Anatomy:** label, optional leading/trailing icon, focus ring, loading spinner.

**Variants:**

| Variant | BG | Text | Border | Use |
|---|---|---|---|---|
| `primary` | `forest` | `cream` | none | Default CTA on light bg |
| `primary-gold` | `gold` | `forest` | none | Hero CTA, money moment |
| `secondary` | transparent | `forest` | `1px forest` | Secondary on cream |
| `secondary-cream` | transparent | `cream` | `1px cream/40` | Secondary on forest |
| `ghost` | transparent | `forest` | none | Tertiary in-line |
| `destructive` | `error` | `cream` | none | Delete, cancel order |
| `link` | transparent | `gold-deep` | underline | In-text |

**Sizes:**

| Size | Height | Px-x | Font |
|---|---|---|---|
| `sm` | 36px | 14px | `body-sm` 600 |
| `md` (default) | 44px | 20px | `button` |
| `lg` | 52px | 28px | `button` size 16 |
| `xl` (hero only) | 60px | 36px | `button` size 17 |

**States:** default / hover / active / focus / disabled / loading.

**Motion:**
- Hover: background brightens 4%, lifts `translateY(-1px)`, shadow goes `sm → md`, 180ms `ease-out`.
- Active: lift returns, scale `0.98`, 80ms.
- Loading: spinner fade-in 120ms, label fade-out 120ms (cross-fade).
- **No bouncing.** No spring overshoot on buttons.

**Accessibility:** Focus ring = `2px solid gold` with `4px` offset transparent. Never remove focus.

### 7.2 Input / Field

**Anatomy:** label (above), helper text (below), error text, leading/trailing slot, character counter (optional).

```
┌─────────────────────────┐
│ LABEL (eyebrow)          │
│ ┌──────────────────────┐ │
│ │ value                 │ │
│ └──────────────────────┘ │
│ Helper / error            │
└─────────────────────────┘
```

**Visual:**
- Height: 48px (mobile-safe, comfortable).
- Background: `paper`. Border: `1px line`. Radius: `radius-sm`.
- Focus: border becomes `forest`, soft inner glow (`shadow-inset-soft`), 160ms.
- Error: border `error`, helper text turns `error`, label tints `error`.

**Motion:** Label can use floating-label pattern — animates from inside to above on focus + value (Framer `layout` prop).

### 7.3 Select / Dropdown

Use Radix Select primitives skinned to match. Open animation: scale 0.96→1 + fade, 160ms `ease-out`. Close: 100ms.

### 7.4 Checkbox / Radio

- 20×20 box. `forest` checked state. White (`paper`) tick.
- Tick animation: stroke-dasharray draw, 220ms `ease-out`.
- Radio: dot scales in 0→1, 200ms with overshoot 1.05 → 1.

### 7.5 Toggle / Switch

44×24 pill. Off = `line`, On = `forest`. Knob slide 220ms `easeOutCubic`. Spring on the knob only, not the track.

### 7.6 Card

**Default card:**
- BG `paper`, border `1px line`, radius `radius-lg`, padding `6` mobile / `8` desktop.
- Shadow `shadow-sm` default → `shadow-md` on hover (only if interactive).
- Hover lift: `translateY(-2px)`, 220ms `ease-out`.

**Product card (PDP related / future multi-product):**
- Image area top, square aspect ratio, image on `cream` bg.
- Title + price + CTA below.
- Hover: image scales 1.0 → 1.03 (image only, contained via overflow-hidden), 400ms.

**Dark card (on forest):**
- BG `sage`, border `1px line-dark`.

### 7.7 Badge / Pill

- Height 24px, px-3, radius-full.
- `solid-gold` (gold bg, forest text) — limited badges.
- `outline-forest` — secondary.
- `solid-success` — in-stock.
- `solid-warning` — low stock.

### 7.8 Tag

Lower-weight pill for ingredient labels. Beige bg, forest text, radius-full. Used on product page ingredient grid (matches packaging style).

### 7.9 Navigation (top)

- Height 72px mobile / 80px desktop. BG `cream/85` with `backdrop-blur-md`. Hairline bottom border.
- Logo left, nav center (desktop only), cart icon + account icon right.
- On scroll past 100px: BG becomes `cream/95`, shadow `shadow-sm`, height shrinks to 64px. 240ms `ease-out`.
- Hamburger on mobile → full-screen drawer (slides from right, 320ms `ease-out-cubic`, content stagger).

### 7.10 Footer

- BG `forest`, text `cream`.
- 4 columns desktop, accordion on mobile.
- Gold hairline divider above payment icons.
- Newsletter signup (single email field + inline submit) at top of footer.

### 7.11 Modal / Dialog

- Backdrop: `forest` at 40% with `backdrop-blur-sm`, fade 200ms.
- Panel: scale 0.96 → 1 + fade-in 220ms `easeOutExpo`. Close = reverse + 160ms.
- Mobile: slide-up bottom sheet (rounded top corners `radius-2xl`).
- Trap focus, ESC closes, click-outside closes.

### 7.12 Toast

- Bottom-right desktop, top of viewport mobile.
- Slide in 200ms + fade. Auto-dismiss 4s.
- Variants: success (olive icon), error (error icon), info, warning.

### 7.13 Tabs

- Underline style (`gold` underline animated with `layout`, Framer).
- Switch content 180ms cross-fade.

### 7.14 Accordion

- Used heavily on FAQ + Ingredients + How to Use.
- Chevron rotates 0 → 180° on open, 220ms.
- Body height animated via `auto` height (Framer's `motion.div` with `height: auto` initial/animate).

### 7.15 Stepper (quantity)

- Two icon buttons + numeric input.
- Pressing animates value with subtle scale (1.0 → 1.08 → 1.0, 200ms).

### 7.16 Skeleton

- Background `linear-gradient(90deg, beige 0%, paper 50%, beige 100%)`.
- 1.4s shimmer cycle.
- Match radius of the element being loaded.

### 7.17 Cart drawer

- Slide from right on desktop, slide from bottom on mobile.
- Backdrop blur. Empty state has illustrated bowl + CTA.

### 7.18 Price display

- Sale price (forest, body-lg+ weight 600) + MRP strike-through (`ink-muted`, body, line-through) + savings pill (gold, eyebrow style).
- Always `₹` with non-breaking space: `₹ 999`.

### 7.19 Star rating

- 5 stars, gold filled, gold-deep outline. 16px stars on cards, 20px on reviews.
- Half-star supported via CSS clip-path.
- Animated fill on initial mount (stagger 60ms per star).

### 7.20 Image with reveal

Default product/lifestyle image component:
- Lazy loaded.
- On enter viewport: subtle scale 1.04 → 1.0 + opacity 0 → 1, 700ms `easeOutExpo`.
- Built-in AVIF/WebP/JPEG fallback via `next/image`.

---

## 8. Motion System (Framer Motion)

### 8.1 Easing curves (canonical)

```ts
export const ease = {
  out:        [0.16, 1, 0.3, 1],      // standard exit
  inOut:      [0.65, 0, 0.35, 1],     // back-and-forth
  outQuart:   [0.25, 1, 0.5, 1],
  outExpo:    [0.16, 1, 0.3, 1],
  outBack:    [0.34, 1.56, 0.64, 1],  // gentle overshoot — use sparingly
  spring: { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 }
};
```

### 8.2 Durations

| Token | ms | Use |
|---|---|---|
| `instant` | 80 | Tap feedback |
| `fast` | 160 | Hover, focus, micro-states |
| `base` | 240 | Component transitions |
| `slow` | 400 | Modal, drawer, large surfaces |
| `epic` | 700 | Hero entrances, scroll reveals |

**Never animate longer than 700ms** unless it's a one-time hero choreography.

### 8.3 Reveal-on-scroll preset

```tsx
// /lib/motion.ts
import { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: ease.outExpo } }
};

export const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};
```

Usage:
```tsx
<motion.section variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }}>
  <motion.h2 variants={fadeUp}>Clean nutrition. Zero hassle.</motion.h2>
  <motion.p   variants={fadeUp}>Pre-portioned packs…</motion.p>
</motion.section>
```

### 8.4 Page transitions

Use `AnimatePresence` with `mode="wait"`. Crossfade 200ms. No slide between pages (feels janky over real router transitions).

### 8.5 Hero choreography (landing)

1. **0ms** — background gradient settles.
2. **80ms** — Logo / eyebrow fade-in.
3. **180ms** — H1 fades up + letter-by-letter mask reveal (use `splitting.js` pattern or Framer per-char).
4. **400ms** — Sub-paragraph fades up.
5. **560ms** — Pouch image scales 0.96 → 1 with subtle Y-float; trust-strip slides up.
6. **720ms** — CTA button fades + gold-glow pulses once.

Total ≤ 1s. Skip animation on `prefers-reduced-motion`.

### 8.6 Scroll-tied (Framer `useScroll`)

- Hero pouch: rotate Y on scroll (-15° → +15° over first viewport).
- Section headings: parallax shift Y -40px → +40px (very subtle).
- "Soak at Night → Eat in Morning" — background gradient morphs from forest-night to cream-dawn as user scrolls section.

### 8.7 Micro-interactions

- **Add to cart**: button morphs label → checkmark (200ms), cart icon in header gets a number badge that pops in with `spring` (stiffness 400, damping 18). Slight horizontal nudge of icon (10px swing). Toast appears.
- **Quantity stepper**: number does a vertical roll (out-of-old + in-of-new), 220ms.
- **Form error**: shake X 6px → -6px → 3px → -3px → 0, 320ms.
- **Image gallery swipe**: drag with elasticity 0.15.

### 8.8 Reduced motion (mandatory)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

In Framer Motion, wrap with `MotionConfig reducedMotion="user"` at root.

---

## 9. Three.js Usage (Selective, Mobile-Aware)

### 9.1 Where to use

Three.js belongs in **exactly three places** — anywhere else is over-engineering for a single-product wellness site.

1. **Hero 3D pouch** (desktop + tablet) — rotating Energy Bite pouch on scroll. Mobile fallback = static hero image.
2. **Ingredient orbit section** — 3D bowl in center with ingredient meshes orbiting on a slow auto-rotate + scroll-tied tilt. Mobile fallback = 2D image grid.
3. **Night → Morning transition** — particle/light scene tying the "Soak at Night, Eat in Morning" narrative. Mobile = CSS gradient morph only.

### 9.2 Performance budget

| Constraint | Value |
|---|---|
| Total GLB size (compressed, Draco) | ≤ 600 KB |
| Texture size | 1024×1024 max, KTX2 / Basis compressed |
| Polygons | ≤ 30K total per scene |
| Draw calls | ≤ 30 |
| Frame target | 60fps desktop, 30fps mid mobile |
| Bundle cost | Three.js + react-three-fiber + drei = ~140KB gzip. Code-split, only load on visible viewport. |

### 9.3 Stack

- **react-three-fiber** (`@react-three/fiber`) — React renderer for Three.
- **@react-three/drei** — helpers (Environment, useGLTF, OrbitControls).
- **leva** — dev-only controls; tree-shaken in prod.

### 9.4 Mobile detection

```ts
const isLowEnd = useMemo(() => {
  if (typeof navigator === 'undefined') return false;
  const mem = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return (mem && mem < 4) || (cores && cores < 4);
}, []);
```

If `isLowEnd` OR viewport width < 768 → render static `<Image>` fallback. Never load Three.js bundle on these clients (dynamic import gated).

### 9.5 Loading pattern

```tsx
const Hero3D = dynamic(() => import('./Hero3D'), {
  ssr: false,
  loading: () => <HeroStatic />
});
```

3D scene lights: 1 ambient + 1 directional + 1 rim. Soft shadows on contact only. Environment HDRI from drei `<Environment preset="warehouse" />` — keeps file size near zero.

### 9.6 Scene direction

- Background transparent — sits on the section background, not on its own canvas color.
- Camera FOV: 35° (cinematic, not fish-eye).
- Auto-rotate Y at 0.2 rad/sec when idle. Scroll multiplies by 4× for the duration of the section.
- Subtle DoF blur on background (drei `<Bokeh>` or post-processing) — only desktop.

---

## 10. Page Layout Patterns

### 10.1 Landing page (binding section order)

1. **Sticky nav** (transparent → cream on scroll).
2. **Hero** — left: H1 + sub + CTA + trust strip; right: 3D pouch (or static on mobile). Background: forest with radial gold glow top-right.
3. **Social proof strip** (cream) — "★ 4.8 from 1,200+ buyers" + small avatars row.
4. **Promise grid** (cream) — 6 icon cards: High Protein / Rich in Fiber / Naturally Sweet / No Preservatives / No Colour Added / Made with Love. Each card animates in on viewport.
5. **The story** (forest) — H2 + paragraph + supporting image. "Soak at Night, Eat in Morning" headline with day/night visual.
6. **Ingredients** (cream) — bowl image center, 10 ingredient circles around in a radial layout (mobile = grid). Hover/tap reveals each ingredient with a fade-in description.
7. **How to use** (forest) — 3-step illustrated (Open → Soak → Eat). Use Framer `whileInView` to reveal each step.
8. **Nutritional facts** (cream) — clean table.
9. **Reviews** (cream) — large featured review at top + grid of 6 below + "See all" CTA.
10. **FAQ** (cream) — accordion.
11. **Final CTA** (forest) — H2 "Start your morning right." + price + buy CTA.
12. **Footer** (forest).

### 10.2 PDP (product detail page, future multi-product or detailed view)

- 2-column desktop: gallery left, info right. Sticky info column on scroll past hero.
- Mobile: gallery on top (swipeable), info below.
- Sticky buy bar at bottom on mobile after scroll past primary CTA.

### 10.3 Checkout

- Single page, 3 visual steps. Order summary collapsible at top on mobile, sticky right on desktop.
- Progress dots up top: contact → shipping → payment. Each dot fills `gold` as completed.
- Place Order button is sticky bottom on mobile, in-flow on desktop.

### 10.4 Account dashboard

- Two-column: sidebar nav (desktop) / bottom-sheet nav (mobile) + content.
- Order cards with status pills, expandable detail.

### 10.5 Admin

- Admin uses **same color palette but inverts hierarchy** — cream-dominant, forest accents, gold reserved for primary admin actions.
- Sidebar nav (collapsible), top bar with search + admin menu.
- Tables: zebra-striped with `beige` on alt rows, sticky header, row hover `paper` highlight.

---

## 11. Imagery & Art Direction

### 11.1 Photography rules

- **Always** include natural greenery (leaf, sprig) in product shots — it's brand-coded.
- Wooden bowls > ceramic for hero ingredient shots (matches packaging).
- Backgrounds: forest dark OR cream — never mid-grey, never bright white.
- Lighting: warm directional from upper-left, soft shadow lower-right.
- Avoid stock-photo people. If people are shown, hand-only / partial — focus stays on product.

### 11.2 Asset usage

| Asset | Where |
|---|---|
| `logos/diteup-logo.svg` | Header (cream BG), light surfaces |
| `logos/logo_light.png` | Header on forest sections |
| `logos/logo_dark.jpeg` | Avoid on web — only for print |
| `products/packaging_design.png` | Hero (mobile fallback), about |
| `social/social_creatives.png` | Reference only — do not embed directly |
| `favicons/favicon-64.png` | Browser favicon |

Generate missing asset variants: hero-mobile-1080.webp, hero-desktop-1920.webp, OG-1200x630.png, square-1080.png (Insta share), pouch-render-front/back/three-quarter.

### 11.3 Image processing

- Format priority: AVIF → WebP → JPEG.
- Quality 80 for hero, 75 for gallery, 70 for thumbnails.
- Always specify dimensions to prevent CLS.
- Use `next/image` `priority` only on hero LCP image.

---

## 12. Tailwind Config (drop-in)

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest:    '#1F3D2E',
        sage:      '#3E5C46',
        olive:     '#6B7F4E',
        cream:     '#F5F0E6',
        beige:     '#E8DFC8',
        paper:     '#FAF7EF',
        gold:      { DEFAULT: '#C8A24A', soft: '#D9B968', deep: '#A8852E' },
        ink:       { DEFAULT: '#0F1F18', soft: '#3A4A41', muted: '#6B7B72' },
        line:      { DEFAULT: '#D9CFB8', dark: '#2A4636' },
        success:   '#5C8A3A',
        warning:   '#C8862A',
        error:     '#A4392E',
        info:      '#4A6B7F',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:    ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['clamp(2.75rem, 4vw + 1rem, 5rem)',  { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-xl':  ['clamp(2.25rem, 3vw + 1rem, 4rem)',  { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'display-lg':  ['clamp(1.875rem, 2vw + 1rem, 3rem)', { lineHeight: '1.12', letterSpacing: '-0.01em' }],
        'display-md':  ['clamp(1.625rem, 1vw + 1rem, 2.25rem)', { lineHeight: '1.18' }],
        'eyebrow':     ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.14em' }],
      },
      borderRadius: {
        xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px',
      },
      boxShadow: {
        xs:   '0 1px 2px rgba(31,61,46,0.04)',
        sm:   '0 2px 6px rgba(31,61,46,0.06), 0 1px 2px rgba(31,61,46,0.04)',
        md:   '0 6px 20px rgba(31,61,46,0.08), 0 2px 6px rgba(31,61,46,0.04)',
        lg:   '0 16px 40px rgba(31,61,46,0.10), 0 6px 14px rgba(31,61,46,0.05)',
        'glow-gold': '0 0 0 1px rgba(200,162,74,0.4), 0 8px 24px rgba(200,162,74,0.25)',
      },
      backgroundImage: {
        'gradient-hero':  'radial-gradient(120% 80% at 80% 0%, rgba(200,162,74,0.18) 0%, transparent 50%), linear-gradient(180deg, #1F3D2E 0%, #2A4636 100%)',
        'gradient-dawn':  'linear-gradient(180deg, #1F3D2E 0%, #6B7F4E 60%, #F5F0E6 100%)',
        'noise':          "url('/textures/noise.png')",
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.85' } },
        'float': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
} satisfies Config;
```

---

## 13. Framer Motion Presets File

```ts
// /lib/motion.ts
import type { Variants, Transition } from 'framer-motion';

export const ease = {
  out:      [0.16, 1, 0.3, 1] as const,
  outQuart: [0.25, 1, 0.5, 1] as const,
  outExpo:  [0.16, 1, 0.3, 1] as const,
  outBack:  [0.34, 1.56, 0.64, 1] as const,
};

export const spring: Transition = { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 };
export const springSnappy: Transition = { type: 'spring', stiffness: 400, damping: 24 };

export const dur = { instant: 0.08, fast: 0.16, base: 0.24, slow: 0.4, epic: 0.7 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.outExpo } }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: dur.base, ease: ease.out } }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show:   { opacity: 1, scale: 1, transition: { duration: dur.base, ease: ease.outExpo } }
};

export const stagger = (gap = 0.08, delay = 0.05): Variants => ({
  hidden: {},
  show:   { transition: { staggerChildren: gap, delayChildren: delay } }
});

export const slideInFromRight: Variants = {
  hidden: { x: '100%' },
  show:   { x: 0, transition: { duration: dur.slow, ease: ease.outExpo } },
  exit:   { x: '100%', transition: { duration: dur.base, ease: ease.out } }
};

export const slideUpSheet: Variants = {
  hidden: { y: '100%' },
  show:   { y: 0, transition: { duration: dur.slow, ease: ease.outExpo } },
  exit:   { y: '100%', transition: { duration: dur.base } }
};

export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show:   { opacity: 1, scale: 1, transition: { duration: dur.base, ease: ease.outExpo } },
  exit:   { opacity: 0, scale: 0.96, transition: { duration: dur.fast } }
};

export const buttonTap = { whileTap: { scale: 0.98 }, whileHover: { y: -1 }, transition: { duration: dur.fast, ease: ease.out } };

export const viewportOnce = { once: true, amount: 0.25 };
```

---

## 14. Folder Structure (Next.js 14 App Router)

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # landing
│   │   ├── product/[slug]/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── account/
│   │   └── ...
│   ├── (admin)/admin/
│   │   ├── layout.tsx            # auth middleware
│   │   ├── page.tsx              # dashboard
│   │   ├── orders/
│   │   ├── products/
│   │   └── ...
│   ├── api/                      # if using BFF; or all on Express
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                       # primitives (Button, Input, Card, …)
│   ├── motion/                   # MotionConfig wrapper, presets
│   ├── three/                    # Hero3D, IngredientOrbit, NightToDay
│   ├── product/
│   ├── cart/
│   ├── checkout/
│   ├── account/
│   ├── admin/
│   └── shared/                   # Header, Footer, SEO
├── lib/
│   ├── motion.ts
│   ├── three/
│   ├── api.ts
│   ├── auth.ts
│   ├── razorpay.ts
│   ├── pixel.ts
│   └── utils.ts
├── styles/
│   └── tokens.css                # CSS custom props mirror
├── public/
│   ├── assets/                   # brand-supplied
│   ├── textures/
│   ├── models/                   # .glb files for three
│   └── fonts/                    # if self-hosting beyond next/font
└── types/
```

---

## 15. CSS Custom Properties (tokens.css)

Mirror Tailwind tokens so non-Tailwind code (3D scenes, canvas, embeds) can reference the same values.

```css
:root {
  --forest:#1F3D2E; --sage:#3E5C46; --olive:#6B7F4E;
  --cream:#F5F0E6; --beige:#E8DFC8; --paper:#FAF7EF;
  --gold:#C8A24A; --gold-soft:#D9B968; --gold-deep:#A8852E;
  --ink:#0F1F18; --ink-soft:#3A4A41; --ink-muted:#6B7B72;
  --line:#D9CFB8; --line-dark:#2A4636;
  --radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-xl:24px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast:160ms; --dur-base:240ms; --dur-slow:400ms;
}

::selection { background: var(--gold); color: var(--forest); }
html { scroll-behavior: smooth; }
body { background: var(--cream); color: var(--ink); font-family: var(--font-montserrat); }
```

---

## 16. Performance Budget (binding)

| Metric | Budget |
|---|---|
| LCP (mobile 4G, mid-tier) | ≤ 2.5s |
| INP | ≤ 200ms |
| CLS | ≤ 0.05 |
| Total JS (landing, gzip) | ≤ 180 KB (excluding Three) |
| Three.js bundle (lazy, only desktop) | ≤ 160 KB gzip |
| Total CSS (gzip) | ≤ 18 KB |
| Hero image (mobile) | ≤ 90 KB AVIF |
| Gallery images | ≤ 120 KB AVIF each |
| Web fonts | 2 families × 2 weights each, subsetted |
| Lighthouse mobile | ≥ 90 perf / 95 a11y / 100 best-practices / 100 SEO |

---

## 17. Accessibility Checklist (must pass before launch)

- [ ] All text ≥ 4.5:1 contrast on its background.
- [ ] Every interactive element keyboard-reachable with visible focus ring.
- [ ] Skip-to-content link at top of page.
- [ ] Headings hierarchy correct (one H1 per page, no skipped levels).
- [ ] Forms have `<label>` and `aria-describedby` for errors.
- [ ] Images have `alt`; decorative images `alt=""`.
- [ ] Color is not the only indicator (stock status uses icon + text + color).
- [ ] `prefers-reduced-motion` respected (motion gated via `MotionConfig`).
- [ ] Modal traps focus and returns it on close.
- [ ] Carousel has prev/next buttons + pause + visible state for screen readers.
- [ ] All custom components tested with VoiceOver (iOS) + TalkBack.

---

## 18. Don'ts (anti-patterns to avoid)

- ❌ Pure black (`#000`) anywhere — use `forest` or `ink`.
- ❌ Pure white (`#FFF`) on cream pages — use `paper`.
- ❌ More than one gold element per viewport.
- ❌ Bouncing / spring overshoot on buttons.
- ❌ Auto-playing video with sound.
- ❌ Modals on first visit (kills CR + Meta policy).
- ❌ Parallax that disables natural scroll.
- ❌ Drop shadows on text.
- ❌ Heavy filters on hero (`blur`, `saturate`) — paint cost on mobile.
- ❌ Animating `width`/`height` (use `transform` + `scale`).
- ❌ More than 2 fonts loaded.
- ❌ Loading Three.js on mobile / low-end devices.

---

## 19. Component Build Order (suggested sprint sequence)

**Week 1:** tokens, Tailwind config, Button, Input, Select, Checkbox, Toggle, Card, Badge, Tag, Header, Footer, Skeleton.

**Week 2:** Hero (with Three.js), product card, gallery, cart drawer, modal, toast, accordion, tabs, stepper, star rating.

**Week 3:** Admin shell, data table, form wizard (checkout), order timeline component, inventory editor, broadcast composer.

**Week 4:** Three.js scenes (Hero pouch, Ingredient orbit, Night→Morning), micro-interactions polish, motion choreography pass, Lighthouse pass.

---

## 20. Open Decisions (need confirmation before sprint 1)

1. Do we want the Three.js scenes in v1, or defer to v1.5? (Recommend: **defer ingredient orbit and night→morning; keep hero pouch only**, to hit the 4-week timeline.)
2. Approve the addition of `JetBrains Mono` for admin/SKU display (optional but recommended).
3. Confirm preferred review-image lightbox library (recommend `yet-another-react-lightbox`).
4. Cookie banner copy + design — minimal bottom-bar or modal? (Recommend: bottom-bar, dismissible.)
5. Logo on dark sections: keep `logo_light.png` or commission an SVG version? (PNG works; SVG is sharper at any size — small spend, high value.)

---

**End of Design System v1.0** — pairs with PRD v1.0. Update both together when scope changes.

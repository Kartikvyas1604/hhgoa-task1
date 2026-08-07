# FrameInGoa — HH Goa 2026 Frame / ID Card Generator

Upload a photo → branded HH Goa 2026 PFP frame or Builder ID card in seconds →
download or share to X with **#FrameInGoa** pre-filled. All image processing
happens in the browser — nothing leaves it.

## Stack

- **Next.js 16 (App Router, Turbopack) + TypeScript**
- **Tailwind CSS v4** — custom design tokens via `@theme` (no default theme)
- **GSAP** — hero load-in (respects `prefers-reduced-motion`)
- **Lenis** — smooth scroll, synced to ScrollTrigger via `gsap.ticker`
- **heic2any** — client-side HEIC → JPEG for iPhone uploads
- **next/og** — per-result OG image route at `/og`

## Routes

| Route | What it is                                              |
| ----- | ------------------------------------------------------- |
| `/`   | Frame Generator — PFP Frame (1:1) or Builder ID Card (4:5) |
| `/og` | Dynamic OG image reflecting format/name/role params     |

## Design language

The palette is derived from `logo.png` (dark leaf green `#2c663e`, bright
yellow `#f9e24c`, magenta `#ea3380`). See `brand.md`.

- Display type: **Fraunces** (variable, opsz 9–144), heavy, tight tracking
- UI/mono: **JetBrains Mono** — labels, buttons, stats, terminal cursor
- Body: **Newsreader** (line-height ≥ 1.6)
- Palette: `--bg-void #0a110c`, `--bg-panel #101b13`, primary yellow
  `#f9e24c`, magenta `#ea3380`, terminal green `#7fff9e` (live/success/share
  states only), warm off-white `#eef1e7`
- One accent dominates per screen. No purple-on-white SaaS gradients.

## The Frame Generator

1. Toggle `PFP Frame` (1:1) or `Builder ID Card` (4:5) — PFP is default.
2. Dropzone accepts **JPG / PNG / HEIC** (HEIC auto-converts client-side).
3. Card format shows two optional mono fields — **name** and **stack/role**.
   Empty role gets a deterministic "builder title" from a word list.
4. Canvas compositing **smart-crops** any aspect ratio to the fixed frame
   ratio — never stretches. Result renders in place with a terminal cursor
   as the only loading state.
5. **Download PNG** (real file via `canvas.toBlob`) and **Share to X**
   (Web Share API attaches the PNG where supported; otherwise a per-result
   OG link opens the X intent). `#FrameInGoa` is always pre-filled.

### How the canvas compositing works

`components/frame/compose.ts` draws directly with the loaded fonts (resolved
from the live CSS vars). Both formats render at 1080px; the card is
1080×1350. Smart-crop uses a cover-fit algorithm centered on the source
image.

## Motion / scroll

- One orchestrated hero load-in (GSAP timeline, ~80ms stagger, headline +
  dropzone), gated behind `prefers-reduced-motion: no-preference`.
- Lenis smooth scroll everywhere it helps; touch input uses Lenis's built-in
  handlers (iOS-safe).
- Terminal-green blinking cursor `▍` is the only "loading" element. No
  spinners.
- All non-essential animation is gated behind
  `prefers-reduced-motion: reduce`.

## Share flows

- `lib/share.ts` — Web Share API with file attachment where supported, else
  X intent (`https://twitter.com/intent/tweet`) with `#FrameInGoa`.
- `app/og/route.tsx` — `next/og` ImageResponse rendering the frame design
  with the result's params (format/name/role) so the link's preview matches
  the generated artifact. Fonts: bundled Geist-Regular.ttf fallback plus a
  best-effort Google Fonts fetch for Fraunces / JetBrains Mono.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
```

## Notes / tradeoffs

- Photo pixels never leave the browser for the generator; the OG route only
  carries text params (format/name/role), so the tweet preview shows the
  frame design with a stylised portrait placeholder rather than the exact
  photo.

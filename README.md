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

| Route      | What it is                                              |
| ---------- | ------------------------------------------------------- |
| `/`        | Frame Generator — PFP Frame (1:1) or Builder ID Card (4:5) |
| `/og`      | Dynamic OG image reflecting format/variant/name/role/img params |
| `/share`   | Hosted frame link — renders the exact frame (photo embedded) + OG preview |

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
- **Design variants** — every frame can be Sunset (yellow), Jade (terminal
  green) or Monsoon (magenta); each swaps accents, scrims, gradients and the
  PFP tagline via `FRAME_VARIANTS` in `components/frame/compose.ts`.

## The Frame Generator

1. Toggle `PFP Frame` (1:1) or `Builder ID Card` (4:5) — PFP is default.
2. Pick a **design variant** (Sunset / Jade / Monsoon).
3. Dropzone accepts **JPG / PNG / HEIC** (HEIC auto-converts client-side);
   a camera button opens a `getUserMedia` viewfinder (front/back flip) for
   snapping straight to a frame.
4. Card format shows two optional mono fields — **name** and **stack/role**.
   Empty role gets a deterministic "builder title" from a word list.
5. Canvas compositing **smart-crops** any aspect ratio to the fixed frame
   ratio — never stretches. Result renders in place with a terminal cursor
   as the only loading state.
6. **Download PNG** (real file via `canvas.toBlob`), **Share to X**
   (Web Share API attaches the PNG where supported; otherwise a per-result
   OG link opens the X intent), or **copy a hosted link**
   (`/share?format=…&img=…` — embeds a ~128px photo thumbnail in the URL so
   the link renders the exact frame and expands with a preview on X).
7. **Session gallery** — the last 10 composed frames persist in
   `localStorage` (downscaled source photo + thumbnail + params). Re-download,
   re-share, copy the hosted link, reload into the editor, or delete.
   Quota-safe: oldest entries drop automatically on overflow.

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
  with the result's params (format/variant/name/role, plus an optional
  embedded photo data URL) so the link's preview matches the generated
  artifact. Fonts: bundled Geist-Regular.ttf fallback plus a best-effort
  Google Fonts fetch for Fraunces / JetBrains Mono.
- `app/share/page.tsx` — hosted frame page. `generateMetadata` sets a
  **photo-free** `og:image` (short URL, crawler-safe); the page body renders
  the photo-embedded frame. Embedded images are capped at ~11k chars because
  Node's default 16KB HTTP header budget rejects longer request lines.

## Notes / tradeoffs

- Photo pixels never leave the browser for the generator; the OG preview
  embeds only a ~128px thumbnail, so the exact photo is a soft-zoom detail.
- Hosted-link photos are stateless (in the URL) — they work on any device but
  the full-resolution PNG is only available via Download in the browser.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
```

Set `NEXT_PUBLIC_SITE_URL` at build time to your deployed origin so the
default `og:image` resolves to an absolute URL (falls back to localhost):

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example npm run build
```

Favicon (`app/icon.png`) and apple-touch icon (`app/apple-icon.png`) are
generated from `logo.png` via `sips` — re-run if the logo changes.

# Brand — FrameInGoa (HH Goa 2026)

_Status: active_

Source: **`logo.png`** (project root, 684×702). Dominant colors extracted
from the logo drive every token in this project. If the logo changes,
re-extract and update this file + `app/globals.css`.

## Palette

| Token               | Hex       | Role in the logo                               |
| ------------------- | --------- | ---------------------------------------------- |
| `--bg-void`         | `#0a110c` | green-black base (logo's dark greens)          |
| `--bg-panel`        | `#101b13` | raised surface                                 |
| `--bg-raise`        | `#17251a` | hover / active surfaces                        |
| `--accent-sunset`   | `#f9e24c` | bright yellow — primary accent                 |
| `--accent-magenta`  | `#ea3380` | magenta — secondary accent                     |
| `--accent-terminal` | `#7fff9e` | live / success / share accent (sparingly)      |
| `--text-primary`    | `#eef1e7` | warm off-white ink                              |
| `--text-muted`      | `#93a39a` | green-gray muted text                          |

Logo reference: leaf green `#2c663e`, yellow `#f9e24c`, magenta `#ea3380`
(secondary greens `#2e6940`, `#618642`, `#94a545`).

## Typography

- Display: **Fraunces** (variable, opsz 9–144) — headlines, heavy + tight
- Mono/UI: **JetBrains Mono** — labels, buttons, stats, terminal cursor
- Body: **Newsreader** — long copy, line-height ≥ 1.6

## Voice

Terminal-first, active voice, specific. "Upload a photo, get a branded frame
in seconds." No empty marketing claims. The blinking cursor `▍` is the only
loading state.

## Rules

- One accent dominates per screen (yellow primary, magenta secondary).
- Terminal green is reserved for live/success/share — never decorative.
- No purple-on-white SaaS gradients.
- All motion respects `prefers-reduced-motion`.

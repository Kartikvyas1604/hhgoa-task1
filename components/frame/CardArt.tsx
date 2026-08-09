"use client";

import type { ReactNode } from "react";
import { Globe } from "lucide-react";
import type { Orientation, Side, SocialLinks } from "@/components/frame/types";
import { LAYOUT } from "@/components/frame/layout";
import { MASK_BOX, PHOTO_MASK_PATH, maskTransform, PhotoMaskDefs } from "@/components/frame/photo-mask";
import { Barcode, builderNumber } from "@/components/frame/barcode";
import { GithubIcon, InstagramIcon, LinkedinIcon, XIcon } from "@/components/frame/social-icons";
import { fontFamilies } from "@/components/frame/fonts";
import { fitFontSize } from "@/components/frame/fit-text";

/** The card's own printed background green — from the source art, exact. */
export const CARD_BG = "#046835";
export const CARD_MUSTARD = "#F4D03F";
const MUSTARD = CARD_MUSTARD;
const MUSTARD_DIM = "rgba(244,208,63,0.38)";

export const CARD_FRAUNCES = "var(--font-fraunces), Fraunces, serif";
export const CARD_MONO = "var(--font-jetbrains), 'JetBrains Mono', monospace";
const FRAUNCES = CARD_FRAUNCES;
const MONO = CARD_MONO;

type IconComponent = (props: { size?: number; color?: string; strokeWidth?: number }) => ReactNode;

interface SocialRow {
  key: keyof SocialLinks;
  icon: IconComponent;
  format: (v: string) => string;
}

const SOCIAL_ROWS: SocialRow[] = [
  { key: "website", icon: Globe, format: (v) => v.replace(/^https?:\/\//, "") },
  { key: "x", icon: XIcon, format: (v) => `X.COM/${v.replace(/^@/, "")}` },
  { key: "instagram", icon: InstagramIcon, format: (v) => `INSTAGRAM.COM/${v.replace(/^@/, "")}` },
  { key: "github", icon: GithubIcon, format: (v) => `GITHUB.COM/${v.replace(/^@/, "")}` },
  { key: "linkedin", icon: LinkedinIcon, format: (v) => `LINKEDIN.COM/IN/${v.replace(/^@/, "")}` },
];

export interface CardArtProps {
  orientation: Orientation;
  side: Side;
  name: string;
  role: string;
  socials: SocialLinks;
  photoUrl: string | null;
  qrDataUrl: string | null;
  /** Seeds the "BUILDER #N/321" number — a fresh random seed per upload
   * (not derived from name/role), consistent between preview and download. */
  builderSeed: string;
  className?: string;
  /** Bumping these re-triggers the 150ms scale-pulse on the photo / text groups. */
  photoPulseKey?: string | number;
  textPulseKey?: string | number;
  /**
   * Skips every <text> node — used by `export.ts` to rasterize the "chrome"
   * layer (art + photo only) and draw text separately via canvas so the
   * download uses real loaded font glyphs, not the browser's SVG-image font
   * substitution. The live preview always renders with text.
   */
  textless?: boolean;
}

export function CardArt({
  orientation,
  side,
  name,
  role,
  socials,
  photoUrl,
  qrDataUrl,
  builderSeed,
  className = "",
  photoPulseKey,
  textPulseKey,
  textless = false,
}: CardArtProps) {
  const layout = LAYOUT[orientation][side];
  const maskBox = MASK_BOX[orientation][side];
  const { w, h } = layout.size;
  const maskId = `photo-mask-${orientation}-${side}`;
  const displayName = (name.trim() || "YOUR NAME").toUpperCase();
  const displayRole = (role.trim() || "YOUR ROLE").toUpperCase();
  const nameIsPlaceholder = !name.trim();
  const roleIsPlaceholder = !role.trim();
  const builderNo = builderNumber(builderSeed);

  let nameSize = layout.name.size;
  let roleSize = layout.role.size;
  if (!textless && typeof document !== "undefined") {
    const fams = fontFamilies();
    nameSize = fitFontSize({
      text: displayName,
      startSize: layout.name.size,
      maxWidth: layout.name.maxWidth,
      fontFamily: fams.display,
      weight: 800,
      letterSpacingEm: 0.01,
    });
    roleSize = fitFontSize({
      text: displayRole,
      startSize: layout.role.size,
      maxWidth: layout.role.maxWidth,
      fontFamily: fams.mono,
      weight: 500,
      letterSpacingEm: 0.1,
    });
  }

  const allRows = SOCIAL_ROWS.map((row) => ({ row, value: socials[row.key]?.trim() }));
  const filledRows = allRows.filter((r) => r.value);
  // nothing filled in yet: show every row dimmed as a preview of what can go there;
  // once at least one is filled, only render the filled rows, re-flowed with no gaps
  const rows = filledRows.length > 0 ? filledRows : allRows;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label={`HH Goa 2026 builder card — ${orientation} ${side}`}
    >
      <PhotoMaskDefs id={maskId} box={maskBox} />

      <rect x={0} y={0} width={w} height={h} fill={CARD_BG} />

      {/* the real, final card artwork — background, bamboo, wordmark, floral
          border, palms, everything but the user's data — as one exact
          asset. Its flower "photo hole" is NOT actually transparent (it's a
          baked-in placeholder graphic in the source export), so the photo
          is drawn on top of the art, clipped to the same flower shape. */}
      <image href={layout.art} x={0} y={0} width={w} height={h} preserveAspectRatio="none" />

      {/* photo, clipped to the exact flower mask and drawn over the art's
          (opaque) placeholder hole */}
      <g key={`photo-${photoPulseKey ?? ""}`} className="card-art-pulse">
        {photoUrl ? (
          <image
            href={photoUrl}
            x={maskBox.cx - maskBox.size / 2}
            y={maskBox.cy - maskBox.size / 2}
            width={maskBox.size}
            height={maskBox.size}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${maskId})`}
          />
        ) : (
          <>
            <path d={PHOTO_MASK_PATH} transform={maskTransform(maskBox)} fill={CARD_BG} />
            <path
              d={PHOTO_MASK_PATH}
              transform={maskTransform(maskBox)}
              fill={MUSTARD_DIM}
              stroke={MUSTARD}
              strokeWidth={3}
              strokeDasharray="10 8"
            />
          </>
        )}
      </g>

      {/* paint over the artwork's baked sample name/role/QR/barcode/socials
          so the real dynamic values can be drawn cleanly in their place */}
      {layout.cover.map((box, i) => (
        <rect key={i} x={box.x} y={box.y} width={box.w} height={box.h} fill={CARD_BG} />
      ))}

      {/* name / role */}
      {!textless && (
        <g key={`text-${textPulseKey ?? ""}`} className="card-art-pulse">
          <text
            x={layout.name.x}
            y={layout.name.y}
            textAnchor={layout.name.anchor}
            fill={MUSTARD}
            opacity={nameIsPlaceholder ? 0.45 : 1}
            fontFamily={FRAUNCES}
            fontWeight={800}
            fontSize={nameSize}
            letterSpacing="0.01em"
          >
            {displayName}
          </text>
          <text
            x={layout.role.x}
            y={layout.role.y}
            textAnchor={layout.role.anchor}
            fill={MUSTARD}
            opacity={roleIsPlaceholder ? 0.4 : 0.85}
            fontFamily={MONO}
            fontSize={roleSize}
            letterSpacing="0.1em"
          >
            {displayRole}
          </text>
        </g>
      )}

      {/* barcode + builder number (front only) */}
      {layout.barcode && (
        <g>
          <Barcode
            seed={builderSeed}
            x={layout.barcode.x}
            y={layout.barcode.y}
            width={layout.barcode.w}
            height={layout.barcode.h}
            color={MUSTARD}
          />
          {!textless && (
            <text
              x={layout.barcode.x}
              y={layout.barcode.labelY}
              fill={MUSTARD}
              fontFamily={MONO}
              fontWeight={700}
              fontSize={20}
              letterSpacing="0.06em"
            >
              BUILDER {builderNo}
            </text>
          )}
        </g>
      )}

      {/* QR code (front only) */}
      {layout.qr && (
        <g>
          {qrDataUrl && (
            <image href={qrDataUrl} x={layout.qr.x} y={layout.qr.y} width={layout.qr.w} height={layout.qr.h} />
          )}
          {!textless && (
            <text
              x={layout.qr.labelX}
              y={layout.qr.labelY}
              textAnchor="middle"
              fill={MUSTARD}
              fontFamily={MONO}
              fontSize={16}
              letterSpacing="0.06em"
            >
              <tspan x={layout.qr.labelX} dy="0">#SCAN TO CREATE</tspan>
              <tspan x={layout.qr.labelX} dy="1.3em">YOUR OWN</tspan>
            </text>
          )}
        </g>
      )}

      {/* socials (back only) */}
      {layout.socials && (
        <g>
          {rows.map(({ row, value }, i) => {
            const Icon = row.icon;
            const y = layout.socials!.yStart + i * layout.socials!.rowHeight;
            const iconSize = layout.socials!.iconSize;
            const label = value ? row.format(value) : `YOUR ${row.key.toUpperCase()}`;
            return (
              <g key={row.key} opacity={value ? 1 : 0.4}>
                <g transform={`translate(${layout.socials!.x} ${y - iconSize * 0.78})`}>
                  <Icon color={MUSTARD} strokeWidth={1.75} size={iconSize} />
                </g>
                {!textless && (
                  <text
                    x={layout.socials!.x + iconSize + 16}
                    y={y}
                    fill={MUSTARD}
                    fontFamily={MONO}
                    fontSize={layout.socials!.fontSize}
                    letterSpacing="0.03em"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}

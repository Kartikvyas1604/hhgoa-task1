"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { CardArt } from "@/components/frame/CardArt";
import { renderCardToPng } from "@/components/frame/export";
import { generateQrDataUrl } from "@/components/frame/qr";
import { MAX_FILE_BYTES, looksLikeImage, processPhoto } from "@/components/frame/image";
import type { Side, SocialLinks } from "@/components/frame/types";
import { UploadDropzone } from "@/components/UploadDropzone";
import { CardForm } from "@/components/CardForm";
import { SegmentToggle } from "@/components/OrientationToggle";
import { ResultPanel } from "@/components/ResultPanel";
import { Card3DModal } from "@/components/Card3DModal";
import { DEFAULT_SHARE_CAPTION, downloadBlob, persistCard, shareToX } from "@/lib/share";

type Status = "idle" | "processing" | "ready" | "error";

/** No orientation toggle any more — every card downloads/shares as the
 * portrait, interactive artifact; the X/timeline preview is always
 * generated as landscape separately (see /share's OG image). */
const orientation = "portrait" as const;

export function FrameGenerator() {
  const [side, setSide] = useState<Side>("front");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [socials, setSocials] = useState<SocialLinks>({});
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bloom, setBloom] = useState(false);
  const [photoPulse, setPhotoPulse] = useState(0);
  const [textPulse, setTextPulse] = useState(0);
  const [view3DUrl, setView3DUrl] = useState<string | null>(null);
  const [view3DBackUrl, setView3DBackUrl] = useState<string | null>(null);
  // a fresh random seed per photo upload — the builder number/barcode are
  // randomized per card, not derived from name/role
  const [builderSeed, setBuilderSeed] = useState("");
  const hasCelebrated = useRef(false);
  const view3DUrlRef = useRef<string | null>(null);
  const view3DBackUrlRef = useRef<string | null>(null);

  const buildSharePath = useCallback(
    () => `/share?side=${side}&name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}`,
    [side, name, role],
  );

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://frameingoa.com";
    const timer = setTimeout(() => {
      generateQrDataUrl(`${origin}${buildSharePath()}`).then(setQrDataUrl);
    }, 350);
    return () => clearTimeout(timer);
  }, [buildSharePath]);

  const onPickFile = useCallback(async (file: File) => {
    if (!looksLikeImage(file)) {
      setStatus("error");
      setError("That file doesn't look like an image. Try JPG, PNG, WebP, or HEIC.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setStatus("error");
      setError("That photo is over 25MB. Pick a smaller one, or a compressed export.");
      return;
    }
    setStatus("processing");
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await processPhoto(file);
      const t0 = performance.now();
      const wait = Math.max(0, 360 - (performance.now() - t0));
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setPhotoDataUrl(dataUrl);
      setPhotoPulse((k) => k + 1);
      setBuilderSeed(`${Date.now()}-${Math.random()}`);
      setStatus("ready");
      if (!hasCelebrated.current) {
        hasCelebrated.current = true;
        setBloom(true);
      }
    } catch (err) {
      console.error("[photo] decode failed:", err);
      const reason = err instanceof Error && err.message ? err.message : String(err);
      setStatus("error");
      setError(`Couldn't read that image on this device (${reason}). Try another, or convert to JPG/PNG first.`);
    } finally {
      setBusy(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPhotoDataUrl(null);
    setStatus("idle");
    setError(null);
    setBloom(false);
    hasCelebrated.current = false;
  }, []);

  const buildFileName = useCallback((ext: string) => `frameingoa-${side}-${Date.now()}.${ext}`, [side]);

  const onDownload = useCallback(async () => {
    if (!photoDataUrl) return;
    setBusy(true);
    try {
      const blob = await renderCardToPng({ orientation, side, name, role, socials, photoDataUrl, qrDataUrl, builderSeed });
      downloadBlob(blob, buildFileName("png"));
    } finally {
      setBusy(false);
    }
  }, [photoDataUrl, side, name, role, socials, qrDataUrl, builderSeed, buildFileName]);

  const onShare = useCallback(async () => {
    if (!photoDataUrl) return;
    setBusy(true);
    try {
      const blob = await renderCardToPng({ orientation, side, name, role, socials, photoDataUrl, qrDataUrl, builderSeed });

      // best-effort: persist the front portrait + landscape to the backend
      // so the shared link gets a real /card/[id] page (3D badge + a proper
      // OG image showing the actual card). Falls back to the client-only
      // /share path (still fully functional) if the backend isn't set up.
      let sharePath = buildSharePath();
      try {
        const [portraitFront, portraitBack, landscapeFront] = await Promise.all([
          side === "front" ? Promise.resolve(blob) : renderCardToPng({ orientation, side: "front", name, role, socials, photoDataUrl, qrDataUrl, builderSeed }),
          side === "back" ? Promise.resolve(blob) : renderCardToPng({ orientation, side: "back", name, role, socials, photoDataUrl, qrDataUrl, builderSeed }),
          renderCardToPng({ orientation: "landscape", side: "front", name, role, socials, photoDataUrl, qrDataUrl, builderSeed }),
        ]);
        const persisted = await persistCard({
          name,
          role,
          socials,
          portraitBlob: portraitFront,
          portraitBackBlob: portraitBack,
          landscapeBlob: landscapeFront,
        });
        if (persisted) sharePath = persisted.path;
      } catch {
        /* backend unavailable — sharePath already falls back to /share */
      }

      await shareToX({
        caption: DEFAULT_SHARE_CAPTION,
        file: blob,
        fileName: buildFileName("png"),
        ogPath: sharePath,
      });
    } finally {
      setBusy(false);
    }
  }, [photoDataUrl, side, name, role, socials, qrDataUrl, builderSeed, buildFileName, buildSharePath]);

  const onView3D = useCallback(async () => {
    if (!photoDataUrl) return;
    setBusy(true);
    try {
      // the interactive 3D badge shows both real sides — front by default,
      // flips to the real back design (not a blank plane) when spun around
      const [frontBlob, backBlob] = await Promise.all([
        renderCardToPng({ orientation, side: "front", name, role, socials, photoDataUrl, qrDataUrl, builderSeed }),
        renderCardToPng({ orientation, side: "back", name, role, socials, photoDataUrl, qrDataUrl, builderSeed }),
      ]);
      const url = URL.createObjectURL(frontBlob);
      const backUrl = URL.createObjectURL(backBlob);
      view3DUrlRef.current = url;
      view3DBackUrlRef.current = backUrl;
      setView3DUrl(url);
      setView3DBackUrl(backUrl);
    } finally {
      setBusy(false);
    }
  }, [photoDataUrl, name, role, socials, qrDataUrl, builderSeed]);

  const closeView3D = useCallback(() => {
    if (view3DUrlRef.current) URL.revokeObjectURL(view3DUrlRef.current);
    if (view3DBackUrlRef.current) URL.revokeObjectURL(view3DBackUrlRef.current);
    view3DUrlRef.current = null;
    view3DBackUrlRef.current = null;
    setView3DUrl(null);
    setView3DBackUrl(null);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border-2 border-[var(--accent-mustard)]/40 bg-[var(--bg-jungle-deep)]">
      <div className="p-4 sm:p-6">
        {!photoDataUrl && status !== "error" && (
          <UploadDropzone onPick={onPickFile} busy={status === "processing"} />
        )}

        {status === "error" && (
          <div role="alert" className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center">
            <X aria-hidden="true" className="h-6 w-6 text-[var(--accent-pink)]" />
            <p className="font-mono text-xs text-[var(--text-cream)]">{error}</p>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border-2 border-[var(--accent-mustard)]/50 px-3 py-2 font-mono text-xs text-[var(--text-cream)]/80 transition-colors duration-100 hover:text-[var(--text-cream)]"
            >
              Try again
            </button>
          </div>
        )}

        {photoDataUrl && status === "ready" && (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
            <div className="flex flex-col gap-4 lg:w-[300px] lg:flex-none">
              <SegmentToggle
                label="SIDE"
                value={side}
                onChange={setSide}
                options={[
                  { value: "front", label: "FRONT" },
                  { value: "back", label: "BACK" },
                ]}
              />
              <CardForm
                name={name}
                role={role}
                onName={(v) => {
                  setName(v);
                  setTextPulse((k) => k + 1);
                }}
                onRole={(v) => {
                  setRole(v);
                  setTextPulse((k) => k + 1);
                }}
                socials={socials}
                onSocials={(next) => {
                  setSocials(next);
                  setTextPulse((k) => k + 1);
                }}
              />
            </div>

            <div className="flex-1">
              <div
                key={side}
                className="mx-auto w-full max-w-[300px] overflow-hidden rounded-lg border-2 border-[var(--accent-mustard)]/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)] card-flip-in"
              >
                <CardArt
                  orientation={orientation}
                  side={side}
                  name={name}
                  role={role}
                  socials={socials}
                  photoUrl={photoDataUrl}
                  qrDataUrl={qrDataUrl}
                  builderSeed={builderSeed}
                  photoPulseKey={photoPulse}
                  textPulseKey={textPulse}
                  className="h-auto w-full"
                />
              </div>
              <ResultPanel
                onDownload={onDownload}
                onShare={onShare}
                onView3D={onView3D}
                onReset={reset}
                busy={busy}
                bloom={bloom}
              />
            </div>
          </div>
        )}
      </div>

      {view3DUrl && (
        <Card3DModal
          imageUrl={view3DUrl}
          backImageUrl={view3DBackUrl ?? undefined}
          name={name}
          role={role}
          onClose={closeView3D}
        />
      )}
    </div>
  );
}

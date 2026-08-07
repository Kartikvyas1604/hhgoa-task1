"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, FlipHorizontal, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    async function start() {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (!alive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        if (alive) {
          setError(
            "Camera unavailable — either the device has no camera or permission was denied.",
          );
        }
      }
    }
    start();
    return () => {
      alive = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  const onShoot = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || busy) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      const longest = 1440;
      const scale = Math.min(1, longest / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("capture failed");
      onCapture(new File([blob], "camera-snap.jpg", { type: "image/jpeg" }));
    } finally {
      setBusy(false);
    }
  }, [busy, onCapture]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Camera capture"
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="font-mono text-[10px] tracking-wide text-muted">
            $ camera — {facing === "user" ? "front" : "back"} ▍
          </p>
          <button
            type="button"
            aria-label="Close camera"
            onClick={onClose}
            className="flex min-h-9 items-center gap-1 rounded-sm px-2.5 py-1.5 font-mono text-[10px] text-muted transition-colors duration-150 hover:text-ink"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            close
          </button>
        </div>

        <div className="relative aspect-square bg-void">
          {error ? (
            <div
              role="alert"
              className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"
            >
              <p className="font-mono text-xs text-ink">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-line px-3 py-2 font-mono text-xs text-muted transition-colors duration-100 hover:text-ink"
              >
                Close
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              aria-label="Camera preview"
              className="h-full w-full scale-x-[-1] object-cover"
            />
          )}
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-line px-4 py-4">
          <button
            type="button"
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            aria-label="Flip camera"
            className="flex min-h-10 items-center gap-1 rounded-md border border-line px-3 py-2 font-mono text-[10px] text-muted transition-colors duration-100 hover:text-ink"
          >
            <FlipHorizontal aria-hidden="true" className="h-4 w-4" />
            flip
          </button>
          <button
            type="button"
            onClick={() => onShoot()}
            disabled={busy || !!error}
            className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-sunset px-6 font-mono text-xs font-bold tracking-wide text-void transition-colors duration-100 hover:bg-[#ffe97a] active:translate-y-px disabled:opacity-50"
          >
            <Camera aria-hidden="true" className="h-4 w-4" />
            {busy ? "snapping…" : "snap photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

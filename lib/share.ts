export const HASHTAG = "#FrameInGoa";

export function buildCaption(text: string): string {
  return `${text}\n\n${HASHTAG}`;
}

export function buildShareUrl(ogPath: string): string {
  const base = window.location.origin;
  return `${base}${ogPath}`;
}

export async function shareToX(opts: {
  caption: string;
  file?: Blob | null;
  ogPath?: string;
}): Promise<"shared" | "intent"> {
  const { caption, file, ogPath } = opts;

  if (file && typeof navigator !== "undefined" && "share" in navigator) {
    const shareData: ShareData = { text: caption };
    const hasFiles = typeof navigator.canShare === "function";
    if (hasFiles) {
      const fileObj = file instanceof File ? file : new File([file], "frame.png", { type: "image/png" });
      if (navigator.canShare({ files: [fileObj] })) {
        shareData.files = [fileObj];
      }
    }
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return "intent";
    }
  }

  const url = ogPath ? buildShareUrl(ogPath) : window.location.href;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    caption,
  )}&url=${encodeURIComponent(url)}`;
  window.open(tweetUrl, "_blank", "noopener,noreferrer");
  return "intent";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

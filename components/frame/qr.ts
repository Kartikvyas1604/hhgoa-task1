import QRCodeStyling from "qr-code-styling";

/**
 * Real, scannable QR code styled to match the card's own baked sample QR —
 * dot-shaped modules and ringed corner markers in card mustard, on a
 * transparent ground — instead of a plain square-module QR. Returns a
 * self-contained PNG data URL so it drops straight into an `<image>`
 * element in both the live preview and the exported SVG.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  const qr = new QRCodeStyling({
    type: "canvas",
    width: 512,
    height: 512,
    data: text,
    margin: 0,
    qrOptions: { errorCorrectionLevel: "M" },
    dotsOptions: { type: "dots", color: "#F4D03F" },
    cornersSquareOptions: { type: "dot", color: "#F4D03F" },
    cornersDotOptions: { type: "dot", color: "#F4D03F" },
    backgroundOptions: { color: "#00000000" },
  });

  const raw = await qr.getRawData("png");
  if (!raw) throw new Error("QR generation failed");
  const blob = raw instanceof Blob ? raw : new Blob([raw as unknown as BlobPart], { type: "image/png" });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

let cachedFamilies: { display: string; mono: string } | null = null;

/** Reads the *actual* resolved next/font family names off the live DOM. */
export function fontFamilies(): { display: string; mono: string } {
  if (cachedFamilies) return cachedFamilies;
  const probe = (cls: string, fallback: string) => {
    const el = document.createElement("span");
    el.className = cls;
    el.style.cssText = "position:absolute;left:-9999px;opacity:0;pointer-events:none;";
    document.body.appendChild(el);
    const fam = getComputedStyle(el).fontFamily;
    el.remove();
    return fam || fallback;
  };
  cachedFamilies = {
    display: probe("font-display", "Fraunces, serif"),
    mono: probe("font-mono", "JetBrains Mono, monospace"),
  };
  return cachedFamilies;
}

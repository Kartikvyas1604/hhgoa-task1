import { PalmTrees } from "@/components/PalmTrees";

export function DuskBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="dusk-hero grain absolute inset-0 overflow-hidden"
    >
      <div
        className="sun-disc absolute -bottom-40 left-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 rounded-full"
        style={{ filter: "blur(6px)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(11,14,12,0.55))",
        }}
      />
      <PalmTrees className="absolute bottom-0" />
    </div>
  );
}

import { PalmTrees } from "@/components/PalmTrees";

export function DuskBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <PalmTrees className="absolute bottom-0" />
    </div>
  );
}

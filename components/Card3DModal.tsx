"use client";

import { X } from "lucide-react";
import { Card3D } from "@/components/Card3D";

interface Card3DModalProps {
  imageUrl: string;
  backImageUrl?: string;
  name: string;
  role: string;
  onClose: () => void;
}

export function Card3DModal({ imageUrl, backImageUrl, name, role, onClose }: Card3DModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-2 overflow-y-auto bg-[var(--ink-black)]/85 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close 3D preview"
        className="stamp-press absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--accent-mustard)]/50 text-[var(--accent-mustard)] transition-colors duration-150 hover:border-[var(--accent-mustard)]"
      >
        <X aria-hidden="true" className="h-5 w-5" />
      </button>

      <Card3D imageUrl={imageUrl} backImageUrl={backImageUrl} className="h-[60vh] w-full max-w-[440px] flex-none" />

      <div className="mt-2 flex flex-col items-center gap-1 text-center">
        {(name || role) && (
          <p className="font-display text-lg font-black tracking-tight text-[var(--accent-mustard)]">
            {name || "YOUR NAME"}
            {role && <span className="ml-2 font-mono text-xs font-normal text-[var(--text-cream)]/70">{role}</span>}
          </p>
        )}
        <p className="font-mono text-[11px] tracking-wide text-[var(--text-cream)]/50">drag to spin · #FrameInGoa</p>
      </div>
    </div>
  );
}

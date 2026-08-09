"use client";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentToggleProps<T extends string> {
  label: string;
  options: [SegmentOption<T>, SegmentOption<T>];
  value: T;
  onChange: (v: T) => void;
}

/** Shared two-way segmented toggle — Portrait/Landscape, Front/Back. */
export function SegmentToggle<T extends string>({ label, options, value, onChange }: SegmentToggleProps<T>) {
  return (
    <div>
      <span className="mb-1.5 block font-mono text-[10px] tracking-wide text-[var(--text-cream)]/70">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="grid grid-cols-2 gap-1 rounded-md border-2 border-[var(--accent-mustard)]/50 bg-[var(--bg-jungle-deep)] p-1"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={`min-h-9 rounded-sm font-mono text-[11px] font-bold tracking-wide transition-colors duration-150 sm:text-xs ${
                active
                  ? "bg-[var(--accent-mustard)] text-[var(--ink-black)]"
                  : "text-[var(--text-cream)]/70 hover:text-[var(--text-cream)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

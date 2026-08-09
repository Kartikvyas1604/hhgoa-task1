"use client";

import { useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import type { SocialLinks } from "@/components/frame/types";
import { GithubIcon, InstagramIcon, LinkedinIcon, XIcon } from "@/components/frame/social-icons";

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  maxLength?: number;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
}

function Field({ label, value, placeholder, onChange, maxLength, icon: Icon }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-[var(--text-cream)]/70">
        {Icon && <Icon size={12} color="var(--accent-mustard)" />}
        {label}
      </span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border-2 border-[var(--accent-mustard)]/50 bg-[var(--bg-jungle-deep)] px-3 font-mono text-sm text-[var(--text-cream)] placeholder:text-[var(--text-cream)]/35 outline-none transition-colors duration-150 focus:border-[var(--accent-mustard)]"
      />
    </label>
  );
}

interface CardFormProps {
  name: string;
  role: string;
  onName: (v: string) => void;
  onRole: (v: string) => void;
  socials: SocialLinks;
  onSocials: (next: SocialLinks) => void;
}

const SOCIAL_FIELDS: {
  key: keyof SocialLinks;
  label: string;
  placeholder: string;
  maxLength: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { key: "website", label: "WEBSITE", placeholder: "yourname.framer.website", maxLength: 40, icon: Globe },
  { key: "x", label: "X", placeholder: "x.com/yourhandle", maxLength: 30, icon: XIcon },
  { key: "instagram", label: "INSTAGRAM", placeholder: "instagram.com/yourhandle", maxLength: 40, icon: InstagramIcon },
  { key: "github", label: "GITHUB", placeholder: "github.com/yourhandle", maxLength: 40, icon: GithubIcon },
  { key: "linkedin", label: "LINKEDIN", placeholder: "linkedin.com/in/yourhandle", maxLength: 40, icon: LinkedinIcon },
];

export function CardForm({ name, role, onName, onRole, socials, onSocials }: CardFormProps) {
  const [socialsOpen, setSocialsOpen] = useState(false);
  const setSocial = (key: keyof SocialLinks) => (v: string) => onSocials({ ...socials, [key]: v });
  const filledCount = SOCIAL_FIELDS.filter((f) => socials[f.key]?.trim()).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="NAME" value={name} placeholder="Kartik Vyas" onChange={onName} maxLength={30} />
        <Field label="ROLE / TITLE" value={role} placeholder="Developer" onChange={onRole} maxLength={30} />
      </div>

      <div className="border-t border-[var(--accent-mustard)]/20 pt-3">
        <button
          type="button"
          onClick={() => setSocialsOpen((v) => !v)}
          aria-expanded={socialsOpen}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="font-mono text-[10px] tracking-wide text-[var(--text-cream)]/70">
            ADD YOUR LINKS
            <span className="text-[var(--text-cream)]/40"> · optional — shown on the back of your card</span>
            {filledCount > 0 && <span className="text-[var(--accent-mustard)]"> · {filledCount} added</span>}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 flex-none text-[var(--text-cream)]/60 transition-transform duration-150 ${socialsOpen ? "rotate-180" : ""}`}
          />
        </button>

        {socialsOpen && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                icon={f.icon}
                value={socials[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={setSocial(f.key)}
                maxLength={f.maxLength}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

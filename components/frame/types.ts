export type Orientation = "landscape" | "portrait";
export type Side = "front" | "back";

export interface SocialLinks {
  website?: string;
  x?: string;
  instagram?: string;
  github?: string;
  linkedin?: string;
}

export interface CardFields {
  name: string;
  role: string;
  socials: SocialLinks;
}

export const CARD_SIZE: Record<Orientation, { w: number; h: number }> = {
  landscape: { w: 1200, h: 675 },
  portrait: { w: 1200, h: 1623 },
};

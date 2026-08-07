import type { Metadata } from "next";
import { ShirtCustomizer } from "@/components/swag/ShirtCustomizer";

export const metadata: Metadata = {
  title: "Swag / Tee Customizer",
  description:
    "Spray-paint a 3D HH Goa 2026 tee in the browser — pick a pattern, spray a colour, stamp your name, then capture and share it with #FrameInGoa.",
};

export default function SwagPage() {
  return <ShirtCustomizer />;
}

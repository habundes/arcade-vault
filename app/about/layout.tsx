import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acerca de · Arcade Vault",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

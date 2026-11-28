import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

// Private / transactional / duplicate-content section: keep out of search results.
export const metadata: Metadata = NOINDEX_METADATA;

export default function NoIndexLayout({ children }: { children: React.ReactNode }) {
  return children;
}

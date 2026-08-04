"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Marks where a listing's results start. When the `category` query param
 * changes (subcategory button clicked), scrolls this point to the top of
 * the viewport instead of leaving the user atop the category buttons.
 */
export function ListingScrollAnchor() {
  const category = useSearchParams().get("category");
  const anchorRef = useRef<HTMLDivElement>(null);
  const skipNext = useRef(true);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [category]);

  return <div ref={anchorRef} className="scroll-mt-20" />;
}

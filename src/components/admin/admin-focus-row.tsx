"use client";

import { useEffect } from "react";

// Scrolls the list back to the row that was just edited (see `focus` param
// set by the edit actions), so staff don't have to scroll down again.
export function AdminFocusRow({ rowId }: { rowId?: string }) {
  useEffect(() => {
    if (!rowId) return;
    document.getElementById(rowId)?.scrollIntoView({ block: "center" });
  }, [rowId]);

  return null;
}

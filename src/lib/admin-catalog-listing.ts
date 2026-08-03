import { parsePageNumber, parsePageSize } from "@/lib/listing";

export type SortDir = "asc" | "desc";

export function parseSortDir(value: string | undefined): SortDir {
  return value === "desc" ? "desc" : "asc";
}

export function toggleSortDir(currentSort: string, column: string, currentDir: SortDir): SortDir {
  if (currentSort === column) return currentDir === "asc" ? "desc" : "asc";
  return "asc";
}

export type AdminListParams = {
  q?: string;
  page: number;
  perPage: number;
  sort: string;
  dir: SortDir;
};

export function parseAdminListParams(
  searchParams: Record<string, string | string[] | undefined>,
): AdminListParams {
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };

  return {
    q: get("q")?.trim() || undefined,
    page: parsePageNumber(get("page")),
    perPage: parsePageSize(get("perPage")),
    sort: get("sort") || "default",
    dir: parseSortDir(get("dir")),
  };
}

export function buildAdminListHref(
  basePath: string,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === false) continue;
    sp.set(key, String(value));
  }
  const query = sp.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Prisma where fragment: species care sheet missing key fields. */
export const CARE_SHEET_INCOMPLETE_WHERE = {
  OR: [
    { descriptionEn: null },
    { descriptionEn: "" },
    { humidity: null },
    { humidity: "" },
    { adultSizeEn: null },
    { adultSizeEn: "" },
  ],
};

export function searchWhere(fields: string[], q?: string) {
  if (!q) return {};
  return {
    OR: fields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" as const },
    })),
  };
}

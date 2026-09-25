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

/**
 * Edit link that remembers the list page (filters, sort, page) it came from,
 * so saving or going back lands on the same spot instead of page 1.
 */
export function buildAdminEditHref(
  basePath: string,
  id: string,
  listParams: Record<string, string | number | boolean | undefined>,
): string {
  const returnTo = buildAdminListHref(basePath, listParams);
  const editPath = `${basePath}/${id}/edit`;
  return returnTo === basePath
    ? editPath
    : `${editPath}?returnTo=${encodeURIComponent(returnTo)}`;
}

/**
 * Only accept return URLs pointing back at this same admin list — never an
 * arbitrary (possibly external) URL.
 */
export function safeAdminReturnTo(basePath: string, raw: unknown): string {
  if (typeof raw !== "string") return basePath;
  if (raw === basePath || raw.startsWith(`${basePath}?`)) return raw;
  return basePath;
}

/** List URL with `focus=<id>` so the list scrolls to and highlights that row. */
export function withAdminFocus(listHref: string, id: string): string {
  const [path, query = ""] = listHref.split("?");
  const sp = new URLSearchParams(query);
  sp.set("focus", id);
  return `${path}?${sp.toString()}`;
}

export function adminRowDomId(id: string): string {
  return `row-${id}`;
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

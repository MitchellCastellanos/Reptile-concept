import { searchListingSuggestions } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const scope = searchParams.get("scope");
  const category = searchParams.get("category") ?? undefined;
  const stock = searchParams.get("stock") ?? undefined;

  if (scope !== "animals" && scope !== "products") {
    return Response.json({ results: [] }, { status: 400 });
  }

  const results = await searchListingSuggestions(scope, q, { category, stock });
  return Response.json({ results });
}

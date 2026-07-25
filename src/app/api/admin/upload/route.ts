import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Le stockage de photos n'est pas encore configuré (BLOB_READ_WRITE_TOKEN manquant). Utilisez le champ URL en attendant, ou contactez GABAN Solutions pour l'activer.",
      },
      { status: 501 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Le fichier doit être une image." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image trop volumineuse (max 8 Mo)." }, { status: 400 });
  }

  const blob = await put(`uploads/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}

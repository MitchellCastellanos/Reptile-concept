import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { getCurrentAdmin } from "@/lib/auth";

// Vercel rejects serverless request bodies above 4.5 MB before they reach this
// route, so stay under it; the admin form downsizes large photos client-side.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_DIMENSION = 1600;

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
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image trop volumineuse (max 4 Mo)." }, { status: 400 });
  }

  try {
    // Always recompress server-side so phone photos (3-8 MB) don't eat the
    // storage quota, even when the admin skips the cropper. GIFs are left
    // alone to keep animation.
    let body: File | Buffer = file;
    let name = file.name;
    let contentType = file.type;
    if (file.type !== "image/gif" && file.type !== "image/svg+xml") {
      body = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      name = file.name.replace(/\.\w+$/, "") + ".webp";
      contentType = "image/webp";
    }

    const blob = await put(`uploads/${Date.now()}-${name}`, body, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Blob upload failed:", err);
    const message = err instanceof Error ? err.message : "";
    if (/quota/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Le stockage de photos est plein. Supprimez d'anciennes images ou utilisez le champ URL en attendant, ou contactez GABAN Solutions.",
        },
        { status: 507 },
      );
    }
    return NextResponse.json(
      { error: "Échec du téléversement de l'image. Réessayez ou utilisez le champ URL." },
      { status: 502 },
    );
  }
}

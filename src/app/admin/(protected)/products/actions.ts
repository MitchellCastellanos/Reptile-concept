"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { safeAdminReturnTo, withAdminFocus } from "@/lib/admin-catalog-listing";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { releaseUnusedBlobs } from "@/lib/blob-cleanup";
import { notifyStockSubscribers } from "@/lib/stock-notifications";
import type { ProductCategoryValue } from "@/lib/product-categories";
import { parseVariantInputs, syncVariantParent } from "@/lib/product-variants";

export type ProductFormState = { error?: string } | undefined;

/**
 * SKUs and Clover item ids are unique across the whole catalogue. Checking up
 * front (before anything is written) gives staff a readable message instead of
 * a crash, and avoids saving a parent product whose sizes then fail.
 */
async function findCatalogConflict(
  parent: { sku: string; cloverItemId: string | null },
  variants: { id?: string; sku: string; cloverItemId: string | null }[],
  parentId?: string,
): Promise<string | null> {
  const skus = [parent.sku, ...variants.map((v) => v.sku)].filter(Boolean);
  const dupInForm = skus.find((sku, i) => skus.indexOf(sku) !== i);
  if (dupInForm) return `Le SKU « ${dupInForm} » est utilisé plus d'une fois dans ce formulaire.`;

  const cloverIds = [parent.cloverItemId, ...variants.map((v) => v.cloverItemId)].filter(
    (id): id is string => Boolean(id),
  );
  const dupClover = cloverIds.find((id, i) => cloverIds.indexOf(id) !== i);
  if (dupClover) return `Le Clover Item ID « ${dupClover} » est utilisé plus d'une fois dans ce formulaire.`;

  // This product and its own current sizes may keep the values they already have.
  const ownIds = [parentId, ...variants.map((v) => v.id)].filter((id): id is string => Boolean(id));
  const clash = await prisma.product.findFirst({
    where: {
      id: { notIn: ownIds },
      OR: [
        { sku: { in: skus } },
        ...(cloverIds.length ? [{ cloverItemId: { in: cloverIds } }] : []),
      ],
    },
    select: { sku: true, nameFr: true, cloverItemId: true },
  });
  if (!clash) return null;
  const what = skus.includes(clash.sku) ? `Le SKU « ${clash.sku} »` : `Le Clover Item ID « ${clash.cloverItemId} »`;
  return `${what} existe déjà (produit : ${clash.nameFr}). Modifiez-le ou supprimez ce produit existant avant de l'utiliser comme taille.`;
}

function readProductForm(formData: FormData) {
  return {
    sku: String(formData.get("sku")),
    category: String(formData.get("category")) as ProductCategoryValue,
    nameFr: String(formData.get("nameFr")),
    nameEn: String(formData.get("nameEn")),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    priceCAD: Number(formData.get("priceCAD")),
    stockQty: Number(formData.get("stockQty")),
    published: formData.get("published") === "on",
    requiresColdChain: formData.get("requiresColdChain") === "on",
    cloverItemId: String(formData.get("cloverItemId") ?? "").trim() || null,
  };
}

/** Extra gallery photos beyond the primary imageUrl — fully replaced on every save. */
async function saveProductGallery(productId: string, formData: FormData) {
  let urls: string[] = [];
  try {
    urls = JSON.parse(String(formData.get("extraPhotoUrls") ?? "[]"));
  } catch {
    urls = [];
  }

  await prisma.media.deleteMany({ where: { productId } });
  if (urls.length > 0) {
    await prisma.media.createMany({
      data: urls.map((url, i) => ({ productId, type: "photo" as const, url, sortOrder: i })),
    });
  }
}

/**
 * Size options ("Pinky", "Adult"…) are stored as child Products, so each keeps
 * its own SKU, price, stock and Clover link. Fully reconciled on every save:
 * rows with an id update that child, rows without create one, and children
 * missing from the form are deleted — or detached (unpublished, no longer a
 * child) when sales history still points at them.
 */
async function saveProductVariants(
  parent: { id: string; category: ProductCategoryValue; nameFr: string; nameEn: string; imageUrl: string | null; published: boolean; requiresColdChain: boolean },
  formData: FormData,
) {
  const inputs = parseVariantInputs(formData.get("variants"));
  const existing = await prisma.product.findMany({ where: { parentId: parent.id } });
  if (inputs.length === 0 && existing.length === 0) return { restockedParent: false };

  for (const v of inputs) {
    if (!v.labelFr || !v.sku || !Number.isFinite(v.priceCAD) || v.priceCAD < 0) {
      throw new Error("Chaque taille doit avoir un nom (FR), un SKU et un prix valide.");
    }
  }

  const kept = new Set(inputs.map((v) => v.id).filter(Boolean));
  const removed = existing.filter((e) => !kept.has(e.id));
  const restockedIds: string[] = [];
  let restockedParent = false;

  await prisma.$transaction(async (tx) => {
    for (const child of removed) {
      const [orders, posSales, cloverSales] = await Promise.all([
        tx.orderItem.count({ where: { productId: child.id } }),
        tx.posSaleItem.count({ where: { productId: child.id } }),
        tx.cloverSaleItem.count({ where: { productId: child.id } }),
      ]);
      if (orders + posSales + cloverSales > 0) {
        await tx.product.update({
          where: { id: child.id },
          data: { parentId: null, published: false },
        });
      } else {
        await tx.product.delete({ where: { id: child.id } });
      }
    }

    for (const [index, v] of inputs.entries()) {
      const labelEn = v.labelEn || v.labelFr;
      const data = {
        parentId: parent.id,
        sku: v.sku,
        category: parent.category,
        nameFr: `${parent.nameFr} — ${v.labelFr}`,
        nameEn: `${parent.nameEn} — ${labelEn}`,
        variantLabelFr: v.labelFr,
        variantLabelEn: labelEn,
        variantSortOrder: index,
        imageUrl: parent.imageUrl,
        priceCAD: v.priceCAD,
        stockQty: v.stockQty,
        published: parent.published,
        requiresColdChain: parent.requiresColdChain,
        cloverItemId: v.cloverItemId,
      };
      const current = v.id ? existing.find((e) => e.id === v.id) : undefined;
      if (current) {
        const restocked = current.stockQty <= 0 && v.stockQty > 0;
        if (restocked) restockedIds.push(current.id);
        await tx.product.update({
          where: { id: current.id },
          data: {
            ...data,
            ...(restocked ? { stockRestockedAt: new Date() } : {}),
            ...(v.stockQty <= 0 ? { stockRestockedAt: null } : {}),
          },
        });
      } else {
        await tx.product.create({
          data: { ...data, stockRestockedAt: v.stockQty > 0 ? new Date() : null },
        });
      }
    }

    restockedParent = (await syncVariantParent(tx, parent.id)).parentRestocked;
  });

  for (const id of restockedIds) {
    notifyStockSubscribers(id).catch((err) =>
      console.error("[admin] failed to notify stock subscribers:", err),
    );
  }
  return { restockedParent };
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const data = readProductForm(formData);
  const conflict = await findCatalogConflict(data, parseVariantInputs(formData.get("variants")));
  if (conflict) return { error: conflict };
  const product = await prisma.product.create({ data });
  await saveProductGallery(product.id, formData);
  await saveProductVariants(product, formData);
  await recordAudit(admin.id, "Product", product.id, "create");

  if (data.cloverItemId) {
    // Resolves the /admin/clover-import queue entry this product was
    // created from, if any — a no-op if the Clover Item ID was typed in by
    // hand instead of coming from that queue.
    await prisma.cloverImportCandidate.updateMany({
      where: { cloverItemId: data.cloverItemId, status: "pending" },
      data: { status: "created" },
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/clover-import");
  redirect("/admin/products");
}

export async function updateProductAction(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const existing = await prisma.product.findUniqueOrThrow({ where: { id } });
  const oldGallery = await prisma.media.findMany({ where: { productId: id }, select: { url: true } });
  const data = readProductForm(formData);
  const conflict = await findCatalogConflict(data, parseVariantInputs(formData.get("variants")), id);
  if (conflict) return { error: conflict };
  const restocked = existing.stockQty <= 0 && data.stockQty > 0;

  await prisma.product.update({
    where: { id },
    data: {
      ...data,
      ...(restocked ? { stockRestockedAt: new Date() } : {}),
      ...(data.stockQty <= 0 ? { stockRestockedAt: null } : {}),
    },
  });
  await saveProductGallery(id, formData);
  const variantResult = await saveProductVariants({ id, ...data }, formData);
  await releaseUnusedBlobs([existing.imageUrl, ...oldGallery.map((m) => m.url)]);
  await recordAudit(admin.id, "Product", id, "update");

  if (restocked || variantResult.restockedParent) {
    notifyStockSubscribers(id).catch((err) =>
      console.error("[admin] failed to notify stock subscribers:", err),
    );
  }

  revalidatePath("/admin/products");
  redirect(withAdminFocus(safeAdminReturnTo("/admin/products", formData.get("returnTo")), id));
}

export async function updateProductPhotoAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  const imageUrl = String(formData.get("photoUrl") ?? "").trim() || null;
  const previous = await prisma.product.findUnique({ where: { id }, select: { imageUrl: true } });
  await prisma.product.update({ where: { id }, data: { imageUrl } });
  await releaseUnusedBlobs([previous?.imageUrl]);
  await recordAudit(admin.id, "Product", id, "update");

  revalidatePath("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const id = String(formData.get("id"));
  const [product, gallery] = await Promise.all([
    prisma.product.findUnique({ where: { id }, select: { imageUrl: true } }),
    prisma.media.findMany({ where: { productId: id }, select: { url: true } }),
  ]);
  await prisma.product.delete({ where: { id } });
  await releaseUnusedBlobs([product?.imageUrl, ...gallery.map((m) => m.url)]);
  await recordAudit(admin.id, "Product", id, "delete");

  revalidatePath("/admin/products");
}

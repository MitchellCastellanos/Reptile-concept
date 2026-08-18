import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    await prisma.newsletterSubscriber.updateMany({
      where: { id, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    });
  }

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#faf8f5;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1f2937;display:flex;min-height:100vh;align-items:center;justify-content:center;">
    <div style="max-width:420px;text-align:center;padding:24px;">
      <h1 style="color:#2d5a3d;font-size:20px;margin:0 0 8px;">Désabonnement confirmé / You're unsubscribed</h1>
      <p style="color:#6b7280;font-size:14px;margin:0;">
        Vous ne recevrez plus nos courriels d'infolettre.<br />
        You will no longer receive our newsletter emails.
      </p>
    </div>
  </body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/supabase";

function verifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET!;
  const digest = crypto.createHmac("sha256", secret).update(body).digest("base64");
  return digest === hmac;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256") ?? "";

  if (!verifyWebhook(body, hmac)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const shop = payload.shop_domain;

  console.log("[GDPR] shop/redact shop:", shop);

  if (shop) {
    // Hapus semua data terkait shop ini
    await db.from("submissions").delete().eq("shop", shop);
    await db.from("product_rules").delete().eq("shop", shop);
    await db.from("subscriptions").delete().eq("shop", shop);
    await db.from("Session").delete().eq("shop", shop);
  }

  return NextResponse.json({ success: true });
}

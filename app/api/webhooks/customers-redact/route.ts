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
  const customerEmail = payload.customer?.email;

  console.log("[GDPR] customers/redact shop:", shop, "email:", customerEmail);

  if (shop && customerEmail) {
    await db
      .from("submissions")
      .delete()
      .eq("shop", shop)
      .eq("customer_email", customerEmail);
  }

  return NextResponse.json({ success: true });
}

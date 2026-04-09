import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
  console.log("[GDPR] customers/data_request:", JSON.stringify(payload));

  // Shopify meminta data customer — log saja, tidak perlu action otomatis
  // Merchant harus secara manual export data jika diminta
  return NextResponse.json({ success: true });
}

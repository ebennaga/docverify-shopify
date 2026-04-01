import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, getAccessToken, validateHmac } from "@/lib/shopify";
import { db } from "@/lib/supabase";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const hmac = searchParams.get("hmac");

  // Step 2: OAuth callback
  if (code && shop && hmac) {
    // Validasi HMAC
    if (!validateHmac(searchParams)) {
      return NextResponse.json({ error: "Invalid HMAC" }, { status: 400 });
    }

    try {
      // Tukar code dengan access token
      const accessToken = await getAccessToken(shop, code);

      // Simpan session ke Supabase
      await db.from("Session").upsert({
        id: `offline_${shop}`,
        shop,
        state: state ?? "",
        access_token: accessToken,
        is_online: false,
        expires_at: null,
      });

      // Redirect ke app di Shopify admin
      const host = searchParams.get("host");
      return NextResponse.redirect(
        `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`,
      );
    } catch (error) {
      console.error("Callback error:", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // Step 1: Mulai OAuth
  if (shop) {
    const nonce = crypto.randomBytes(16).toString("hex");

    // Simpan nonce untuk validasi nanti
    await db.from("Session").upsert({
      id: `pending_${shop}`,
      shop,
      state: nonce,
      is_online: false,
    });

    const authUrl = getAuthUrl(shop, nonce);
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json(
    { error: "Missing shop parameter" },
    { status: 400 },
  );
}

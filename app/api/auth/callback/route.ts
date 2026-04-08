import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, validateHmac } from "@/lib/shopify";
import { db } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");
  const code = searchParams.get("code");
  const hmac = searchParams.get("hmac");
  const state = searchParams.get("state");

  if (!shop || !code || !hmac) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  if (!validateHmac(searchParams)) {
    return NextResponse.json({ error: "Invalid HMAC" }, { status: 400 });
  }

  try {
    const tokenData = await getAccessToken(shop, code);
    const { access_token, refresh_token, expires_in } = tokenData;

    if (!access_token) {
      return NextResponse.json({ error: "No access token", detail: tokenData }, { status: 500 });
    }

    const expires_at = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    await db.from("Session").delete().eq("shop", shop);
    await db.from("Session").insert({
      id: `offline_${shop}`,
      shop,
      state: state ?? "",
      access_token,
      refresh_token: refresh_token ?? null,
      is_online: false,
      expires_at,
    });

    console.log("[auth/callback] saved token, expires_at:", expires_at);

    return NextResponse.redirect(
      `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`,
    );
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

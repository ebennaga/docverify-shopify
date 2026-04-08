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
    // Log raw response dari Shopify
    const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });
    const tokenData = await res.json();
    console.log("[auth/callback] raw token response:", JSON.stringify(tokenData));
    console.log("[auth/callback] SHOPIFY_API_KEY starts with:", process.env.SHOPIFY_API_KEY?.slice(0, 8));

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: "No access token", detail: tokenData }, { status: 500 });
    }

    await db.from("Session").delete().eq("shop", shop);
    await db.from("Session").insert({
      id: `offline_${shop}`,
      shop,
      state: state ?? "",
      access_token: accessToken,
      is_online: false,
      expires_at: null,
    });

    return NextResponse.redirect(
      `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`,
    );
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

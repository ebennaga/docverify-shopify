import { shopify } from "@/lib/shopify";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");
  const code = searchParams.get("code");

  // Callback dari Shopify setelah OAuth
  if (code && shop) {
    try {
      const callbackResponse = await shopify.auth.callback({
        rawRequest: request,
        rawResponse: new NextResponse(),
      });

      const { session } = callbackResponse;

      // Simpan session ke Supabase
      const { db } = await import("@/lib/supabase");
      await db.from("Session").upsert({
        id: session.id,
        shop: session.shop,
        state: session.state,
        access_token: session.accessToken,
        is_online: session.isOnline,
        expires_at: session.expires?.toISOString() ?? null,
      });

      // Redirect ke admin app
      return NextResponse.redirect(
        `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`,
      );
    } catch (error) {
      console.error("Auth callback error:", error);
      return NextResponse.json({ error: "Auth failed" }, { status: 500 });
    }
  }

  // Mulai OAuth flow
  if (shop) {
    const sanitizedShop = shopify.utils.sanitizeShop(shop, true);
    if (!sanitizedShop) {
      return NextResponse.json({ error: "Invalid shop" }, { status: 400 });
    }

    const authRoute = await shopify.auth.begin({
      shop: sanitizedShop,
      callbackPath: "/api/auth",
      isOnline: false,
      rawRequest: request,
      rawResponse: new NextResponse(),
    });

    return authRoute;
  }

  return NextResponse.json(
    { error: "Missing shop parameter" },
    { status: 400 },
  );
}

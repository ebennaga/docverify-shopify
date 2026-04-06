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
    const accessToken = await getAccessToken(shop, code);

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token returned" },
        { status: 500 },
      );
    }

    // Hapus semua session lama untuk shop ini
    await db.from("Session").delete().eq("shop", shop);

    // Insert session baru dengan token
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

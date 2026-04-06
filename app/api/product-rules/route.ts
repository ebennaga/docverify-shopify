import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

async function syncRestrictedProducts(shop: string) {
  try {
    const { data: rules } = await db
      .from("product_rules")
      .select("product_id")
      .eq("shop", shop)
      .eq("is_active", true);

    const productIds = (rules ?? [])
      .map((r) => {
        const pid = r.product_id ?? "";
        if (pid.startsWith("gid://")) return pid.split("/").pop();
        if (pid.includes("/products/")) return pid.split("/products/")[1];
        return pid;
      })
      .filter(Boolean)
      .join(",");

    const { data: session } = await db
      .from("Session")
      .select("access_token")
      .eq("shop", shop)
      .single();

    if (!session?.access_token) return;

    // Ambil Shop ID yang benar dulu
    const shopRes = await fetch(
      `https://${shop}/admin/api/2025-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.access_token,
        },
        body: JSON.stringify({ query: `{ shop { id } }` }),
      },
    );
    const shopData = await shopRes.json();
    const shopId = shopData?.data?.shop?.id;

    if (!shopId) return;

    // Update metafield dengan Shop ID yang benar
    const metaRes = await fetch(
      `https://${shop}/admin/api/2025-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.access_token,
        },
        body: JSON.stringify({
          query: `
          mutation SetMetafield($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields { id key value }
              userErrors { field message }
            }
          }
        `,
          variables: {
            metafields: [
              {
                ownerId: shopId,
                namespace: "docverify",
                key: "restricted_product_ids",
                value: productIds,
                type: "single_line_text_field",
              },
            ],
          },
        }),
      },
    );

    const metaData = await metaRes.json();
    console.log("Metafield sync result:", JSON.stringify(metaData));
  } catch (err) {
    console.error("Sync metafield error:", err);
  }
}

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop)
    return NextResponse.json({ error: "shop required" }, { status: 400 });

  const { data, error } = await db
    .from("product_rules")
    .select("*")
    .eq("shop", shop)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      productTitle,
      docType,
      uploadTitle,
      helperText,
      errorMessage,
    } = body;
    const shop = body.shop ?? "testssaja.myshopify.com";

    const { data, error } = await db
      .from("product_rules")
      .insert({
        id: crypto.randomUUID(),
        shop,
        product_id: productId,
        product_title: productTitle,
        doc_type: docType,
        upload_title: uploadTitle,
        helper_text: helperText,
        error_message: errorMessage,
        is_active: true,
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    // Sync metafield otomatis
    await syncRestrictedProducts(shop);

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

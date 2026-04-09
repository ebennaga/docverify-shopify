import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getValidAccessToken } from "@/lib/session";

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

    const accessToken = await getValidAccessToken(shop);
    if (!accessToken) return;

    const shopRes = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query: `{ shop { id } }` }),
    });

    const shopData = await shopRes.json();
    const shopId = shopData?.data?.shop?.id;
    if (!shopId) return;

    const metaRes = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
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
          metafields: [{
            ownerId: shopId,
            namespace: "docverify",
            key: "restricted_product_ids",
            value: productIds,
            type: "single_line_text_field",
          }],
        },
      }),
    });

    const metaData = await metaRes.json();
    console.log("Metafield sync result:", JSON.stringify(metaData));
  } catch (err) {
    console.error("Sync metafield error:", err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (body.isActive !== undefined) updateData.is_active = body.isActive;
  if (body.docType !== undefined) updateData.doc_type = body.docType;
  if (body.uploadTitle !== undefined) updateData.upload_title = body.uploadTitle;
  if (body.helperText !== undefined) updateData.helper_text = body.helperText;
  if (body.errorMessage !== undefined) updateData.error_message = body.errorMessage;

  const { data, error } = await db
    .from("product_rules")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (data?.shop) await syncRestrictedProducts(data.shop);
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data } = await db
    .from("product_rules")
    .select("shop")
    .eq("id", id)
    .single();

  const { error } = await db.from("product_rules").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (data?.shop) await syncRestrictedProducts(data.shop);
  return NextResponse.json({ success: true });
}

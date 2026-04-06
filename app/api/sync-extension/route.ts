import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { shop } = await req.json();

    // Ambil semua active product rules
    const { data: rules } = await db
      .from("product_rules")
      .select("product_id")
      .eq("shop", shop)
      .eq("is_active", true);

    // Extract numeric IDs
    const productIds = (rules ?? [])
      .map((r) => {
        const pid = r.product_id ?? "";
        if (pid.startsWith("gid://")) return pid.split("/").pop();
        if (pid.includes("/products/")) return pid.split("/products/")[1];
        return pid;
      })
      .filter(Boolean)
      .join(",");

    // Ambil session untuk dapat access token
    const { data: session } = await db
      .from("Session")
      .select("access_token")
      .eq("shop", shop)
      .single();

    if (!session?.access_token) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    // Update extension settings via Shopify API
    const shopifyRes = await fetch(
      `https://${shop}/admin/api/2025-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.access_token,
        },
        body: JSON.stringify({
          query: `
            mutation UpdateExtensionSettings($handle: String!, $settings: [MetaobjectFieldInput!]!) {
              metaobjectUpsert(handle: { handle: $handle, type: "doc_verify_settings" }, metaobject: { fields: $settings }) {
                metaobject { id }
                userErrors { field message }
              }
            }
          `,
          variables: {
            handle: "doc-verify-settings",
            settings: [{ key: "restricted_product_ids", value: productIds }],
          },
        }),
      },
    );

    return NextResponse.json({ success: true, productIds });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

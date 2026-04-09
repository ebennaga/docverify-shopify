import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getValidAccessToken } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { shop } = await req.json();

  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const accessToken = await getValidAccessToken(shop);
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: sub } = await db
    .from("subscriptions")
    .select("charge_id")
    .eq("shop", shop)
    .single();

  if (sub?.charge_id) {
    const query = `
      mutation AppSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          appSubscription { id status }
          userErrors { field message }
        }
      }
    `;
    await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables: { id: sub.charge_id } }),
    });
  }

  await db.from("subscriptions").upsert({
    shop,
    plan: "free",
    status: "active",
    charge_id: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "shop" });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");
  const plan = searchParams.get("plan");

  // GraphQL pakai charge_id atau subscription_id
  const chargeId = searchParams.get("charge_id") ?? searchParams.get("subscription_id");

  console.log("[billing/callback] params:", { shop, plan, chargeId, all: Object.fromEntries(searchParams) });

  if (!shop || !plan) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const { data: session } = await db
    .from("Session")
    .select("access_token")
    .eq("shop", shop)
    .single();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Kalau tidak ada chargeId dari params, ambil dari database
  let resolvedChargeId = chargeId;
  if (!resolvedChargeId) {
    const { data: sub } = await db
      .from("subscriptions")
      .select("charge_id")
      .eq("shop", shop)
      .single();
    resolvedChargeId = sub?.charge_id ?? null;
  }

  console.log("[billing/callback] resolvedChargeId:", resolvedChargeId);

  if (!resolvedChargeId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}&error=not_found`
    );
  }

  // Query GraphQL untuk cek status subscription
  const numericId = resolvedChargeId.includes("/")
    ? resolvedChargeId
    : `gid://shopify/AppSubscription/${resolvedChargeId}`;

  const query = `
    query GetSubscription($id: ID!) {
      node(id: $id) {
        ... on AppSubscription {
          id
          status
          currentPeriodEnd
        }
      }
    }
  `;

  const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.access_token,
    },
    body: JSON.stringify({ query, variables: { id: numericId } }),
  });

  const data = await response.json();
  console.log("[billing/callback] subscription status:", JSON.stringify(data));

  const subscription = data?.data?.node;
  const status = subscription?.status;

  if (status === "ACTIVE") {
    await db.from("subscriptions").upsert({
      shop,
      plan,
      status: "active",
      charge_id: resolvedChargeId,
      current_period_end: subscription.currentPeriodEnd ?? null,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}&success=true`
    );
  }

  if (status === "DECLINED" || status === "EXPIRED") {
    await db.from("subscriptions").upsert({
      shop,
      plan: "free",
      status: "active",
      charge_id: null,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}&error=declined`
    );
  }

  // Status PENDING - update manual dulu
  await db.from("subscriptions").upsert({
    shop,
    plan,
    status: "active",
    charge_id: resolvedChargeId,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}&success=true`
  );
}

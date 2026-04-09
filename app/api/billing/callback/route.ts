import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");
  const plan = searchParams.get("plan");
  const chargeIdParam = searchParams.get("charge_id");

  console.log("[billing/callback] all params:", Object.fromEntries(searchParams));

  if (!shop || !plan) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const { data: session } = await db
    .from("Session")
    .select("access_token")
    .eq("shop", shop)
    .single();

  if (!session?.access_token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}&error=not_authenticated`
    );
  }

  // Pakai charge_id dari params, konversi ke GID format
  const chargeId = chargeIdParam
    ? `gid://shopify/AppSubscription/${chargeIdParam}`
    : null;

  if (!chargeId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}&error=not_found`
    );
  }

  // Cek status subscription via GraphQL
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
    body: JSON.stringify({ query, variables: { id: chargeId } }),
  });

  const data = await response.json();
  const status = data?.data?.node?.status;
  const currentPeriodEnd = data?.data?.node?.currentPeriodEnd;

  console.log("[billing/callback] subscription status from Shopify:", status);

  if (status === "ACTIVE") {
    await db.from("subscriptions").upsert({
      shop,
      plan,
      status: "active",
      charge_id: chargeId,
      current_period_end: currentPeriodEnd ?? null,
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

  // PENDING - update ke active karena merchant sudah approve
  await db.from("subscriptions").upsert({
    shop,
    plan,
    status: "active",
    charge_id: chargeId,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}&success=true`
  );
}

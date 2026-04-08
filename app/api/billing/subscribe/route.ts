import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

const PLANS: Record<string, { name: string; price: string }> = {
  basic: { name: "DocVerify Basic", price: "9.00" },
  pro: { name: "DocVerify Pro", price: "15.00" },
};

export async function POST(req: NextRequest) {
  const { shop, plan } = await req.json();

  if (!shop || !PLANS[plan]) {
    return NextResponse.json({ error: "Invalid shop or plan" }, { status: 400 });
  }

  const { data: session } = await db
    .from("Session")
    .select("access_token")
    .eq("shop", shop)
    .single();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Shop not authenticated" }, { status: 401 });
  }

  const { name, price } = PLANS[plan];
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/callback?shop=${shop}&plan=${plan}`;

  const query = `
    mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean) {
      appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl, test: $test) {
        appSubscription {
          id
          status
        }
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    name,
    returnUrl,
    test: process.env.NODE_ENV !== "production",
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: { amount: price, currencyCode: "USD" },
            interval: "EVERY_30_DAYS",
          },
        },
      },
    ],
  };

  const response = await fetch(
    `https://${shop}/admin/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.access_token,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const data = await response.json();
  console.log("[billing/subscribe] GraphQL response:", JSON.stringify(data));

  const result = data?.data?.appSubscriptionCreate;

  if (!result || result.userErrors?.length > 0) {
    console.error("GraphQL billing error:", result?.userErrors);
    return NextResponse.json({ error: "Failed to create subscription", detail: result?.userErrors }, { status: 500 });
  }

  const { appSubscription, confirmationUrl } = result;

  await db.from("subscriptions").upsert({
    shop,
    plan,
    status: "pending",
    charge_id: appSubscription.id,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ confirmationUrl });
}

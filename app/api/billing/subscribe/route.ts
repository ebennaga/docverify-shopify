import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

const PLANS: Record<string, { name: string; price: string }> = {
  basic: { name: "DocVerify Basic", price: "9.00" },
  pro: { name: "DocVerify Pro", price: "15.00" },
};

export async function POST(req: NextRequest) {
  const { shop, plan } = await req.json();

  if (!shop || !PLANS[plan]) {
    return NextResponse.json(
      { error: "Invalid shop or plan" },
      { status: 400 },
    );
  }

  const { data: session } = await db
    .from("Session")
    .select("access_token")
    .eq("shop", shop)
    .single();

  if (!session?.access_token) {
    return NextResponse.json(
      { error: "Shop not authenticated" },
      { status: 401 },
    );
  }

  const { name, price } = PLANS[plan];
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/callback?shop=${shop}&plan=${plan}`;

  const response = await fetch(
    `https://${shop}/admin/api/2024-01/recurring_application_charges.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.access_token,
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name,
          price,
          return_url: returnUrl,
          trial_days: 7,
          test: process.env.NODE_ENV !== "production",
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok || !data.recurring_application_charge) {
    console.error("Shopify billing error:", data);
    return NextResponse.json(
      { error: "Failed to create charge" },
      { status: 500 },
    );
  }

  const charge = data.recurring_application_charge;

  await db.from("subscriptions").upsert({
    shop,
    plan,
    status: "pending",
    charge_id: String(charge.id),
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ confirmationUrl: charge.confirmation_url });
}

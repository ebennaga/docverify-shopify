import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get("shop");
  const plan = searchParams.get("plan");
  const chargeId = searchParams.get("charge_id");

  if (!shop || !plan || !chargeId) {
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

  const response = await fetch(
    `https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}.json`,
    {
      headers: { "X-Shopify-Access-Token": session.access_token },
    },
  );

  const data = await response.json();
  const charge = data.recurring_application_charge;

  if (!charge) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}&error=not_found`,
    );
  }

  if (charge.status === "accepted") {
    await fetch(
      `https://${shop}/admin/api/2024-01/recurring_application_charges/${chargeId}/activate.json`,
      {
        method: "POST",
        headers: { "X-Shopify-Access-Token": session.access_token },
      },
    );

    await db.from("subscriptions").upsert({
      shop,
      plan,
      status: "active",
      charge_id: chargeId,
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}&success=true`,
    );
  }

  if (charge.status === "declined") {
    await db.from("subscriptions").upsert({
      shop,
      plan: "free",
      status: "active",
      charge_id: null,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}&error=declined`,
    );
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?shop=${shop}`,
  );
}

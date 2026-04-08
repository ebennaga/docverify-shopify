import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { shop } = await req.json();

  if (!shop)
    return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const { data: session } = await db
    .from("Session")
    .select("access_token")
    .eq("shop", shop)
    .single();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: sub } = await db
    .from("subscriptions")
    .select("charge_id")
    .eq("shop", shop)
    .single();

  if (sub?.charge_id) {
    await fetch(
      `https://${shop}/admin/api/2024-01/recurring_application_charges/${sub.charge_id}.json`,
      {
        method: "DELETE",
        headers: { "X-Shopify-Access-Token": session.access_token },
      },
    );
  }

  await db.from("subscriptions").upsert({
    shop,
    plan: "free",
    status: "active",
    charge_id: null,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}

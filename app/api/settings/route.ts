import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop)
    return NextResponse.json({ error: "shop required" }, { status: 400 });

  const { data } = await db
    .from("shop_settings")
    .select("*")
    .eq("shop", shop)
    .single();

  return NextResponse.json(data ?? { shop, notification_email: "" });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { shop, notificationEmail } = body;

  if (!shop)
    return NextResponse.json({ error: "shop required" }, { status: 400 });

  const { data, error } = await db
    .from("shop_settings")
    .upsert({
      shop,
      notification_email: notificationEmail,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

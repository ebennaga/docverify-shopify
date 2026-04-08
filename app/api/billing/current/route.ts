import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlan } from "@/lib/billing";

export async function GET(req: NextRequest) {
  const shop = new URL(req.url).searchParams.get("shop");
  if (!shop) return NextResponse.json({ error: "Missing shop" }, { status: 400 });

  const plan = await getCurrentPlan(shop);
  return NextResponse.json({ plan });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers });
}

export async function POST(req: NextRequest) {
  try {
    const { productIds } = await req.json();

    if (!productIds || productIds.length === 0) {
      return NextResponse.json(
        { hasRestricted: false, restrictedIds: [] },
        { headers },
      );
    }

    const { data, error } = await db
      .from("product_rules")
      .select("product_id")
      .in("product_id", productIds)
      .eq("is_active", true);

    if (error) {
      return NextResponse.json(
        { hasRestricted: false, restrictedIds: [] },
        { headers },
      );
    }

    const restrictedIds = data?.map((r) => r.product_id) ?? [];

    return NextResponse.json(
      { hasRestricted: restrictedIds.length > 0, restrictedIds },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { hasRestricted: false, restrictedIds: [] },
      { headers },
    );
  }
}

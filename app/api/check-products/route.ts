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

    // Extract numeric ID dari GID format
    // gid://shopify/Product/9308163965163 → 9308163965163
    const numericIds = productIds.map((id: string) => {
      if (id.startsWith("gid://")) {
        return id.split("/").pop();
      }
      return id;
    });

    // Ambil semua active rules
    const { data, error } = await db
      .from("product_rules")
      .select("product_id")
      .eq("is_active", true);

    if (error || !data) {
      return NextResponse.json(
        { hasRestricted: false, restrictedIds: [] },
        { headers },
      );
    }

    // Normalize semua product_id di database juga
    const restrictedNumericIds = data
      .map((r) => {
        const pid = r.product_id ?? "";
        if (pid.startsWith("gid://")) return pid.split("/").pop();
        if (pid.includes("/products/")) return pid.split("/products/")[1];
        return pid;
      })
      .filter(Boolean);

    // Cek apakah ada match
    const matchedIds = numericIds.filter((id: string) =>
      restrictedNumericIds.includes(id),
    );

    return NextResponse.json(
      {
        hasRestricted: matchedIds.length > 0,
        restrictedIds: matchedIds,
      },
      { headers },
    );
  } catch {
    return NextResponse.json(
      { hasRestricted: false, restrictedIds: [] },
      { headers },
    );
  }
}

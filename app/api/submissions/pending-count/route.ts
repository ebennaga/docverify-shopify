import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) return NextResponse.json({ count: 0 });

  const { count, error } = await db
    .from("doc_submissions")
    .select("*", { count: "exact", head: true })
    .eq("shop", shop)
    .eq("status", "pending");

  if (error) return NextResponse.json({ count: 0 });

  return NextResponse.json({ count: count ?? 0 });
}

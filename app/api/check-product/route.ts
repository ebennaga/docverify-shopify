import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON!,
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("product_id");

  const { data } = await supabase
    .from("product_rules")
    .select("*")
    .eq("product_id", productId)
    .single();

  return NextResponse.json({
    require_upload: data?.require_upload || false,
    message: data?.message || "Upload required",
  });
}

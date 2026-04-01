import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop)
    return NextResponse.json({ error: "shop required" }, { status: 400 });

  const { data, error } = await db
    .from("product_rules")
    .select("*")
    .eq("shop", shop)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    shop,
    productId,
    productTitle,
    docType,
    uploadTitle,
    helperText,
    errorMessage,
  } = body;

  const { data, error } = await db
    .from("product_rules")
    .insert({
      id: crypto.randomUUID(),
      shop,
      product_id: productId,
      product_title: productTitle,
      doc_type: docType,
      upload_title: uploadTitle,
      helper_text: helperText,
      error_message: errorMessage,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

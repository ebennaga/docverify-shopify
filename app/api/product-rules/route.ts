import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("POST /api/product-rules body:", JSON.stringify(body));

    const {
      productId,
      productTitle,
      docType,
      uploadTitle,
      helperText,
      errorMessage,
    } = body;
    const shop = body.shop ?? "testssaja.myshopify.com";

    console.log("Inserting with shop:", shop);

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
        is_active: true,
      })
      .select()
      .single();

    console.log("Insert result:", JSON.stringify({ data, error }));

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 },
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

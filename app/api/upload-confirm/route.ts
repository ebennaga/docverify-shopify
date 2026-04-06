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
    const { filePath, shop } = await req.json();

    if (!filePath) {
      return NextResponse.json(
        { error: "Missing filePath" },
        { status: 400, headers },
      );
    }

    // Ambil file_name dari filePath
    const fileName = filePath.split("/").pop() ?? filePath;

    // Cek apakah sudah ada record dengan filePath ini
    const { data: existing } = await db
      .from("doc_submissions")
      .select("id")
      .eq("file_path", filePath)
      .single();

    if (existing) {
      // Update shop kalau record sudah ada
      await db
        .from("doc_submissions")
        .update({ shop: shop ?? "unknown" })
        .eq("file_path", filePath);
    } else {
      // Insert record baru
      await db.from("doc_submissions").insert({
        id: crypto.randomUUID(),
        shop: shop ?? "unknown",
        order_id: "pending",
        order_name: "pending",
        product_id: "unknown",
        file_path: filePath,
        file_name: fileName,
        status: "pending",
      });
    }

    return NextResponse.json({ success: true }, { headers });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers });
  }
}

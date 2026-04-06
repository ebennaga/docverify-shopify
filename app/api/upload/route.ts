import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

const BUCKET = "doc-verifications";

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
    const {
      fileName,
      fileType,
      fileData,
      productIds,
      shop,
      orderId,
      customerEmail,
    } = await req.json();

    if (!fileName || !fileData) {
      return NextResponse.json(
        { error: "Missing file data" },
        { status: 400, headers },
      );
    }

    const buffer = Buffer.from(fileData, "base64");
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `uploads/${timestamp}-${cleanFileName}`;

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500, headers },
      );
    }

    // Simpan ke doc_submissions
    const shopValue = shop ?? "unknown";
    const { error: dbError } = await db.from("doc_submissions").insert({
      id: crypto.randomUUID(),
      shop: shopValue,
      order_id: "pending",
      order_name: "pending",
      customer_email: customerEmail ?? null,
      product_id: productIds?.[0] ?? "unknown",
      file_path: filePath,
      file_name: fileName,
      file_size: buffer.length,
      status: "pending",
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
    }

    return NextResponse.json(
      { success: true, filePath, fileName },
      { headers },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers });
  }
}

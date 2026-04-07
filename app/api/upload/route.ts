import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sendSubmissionNotification } from "@/lib/email";

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
    const submissionId = crypto.randomUUID();

    const { error: dbError } = await db.from("doc_submissions").insert({
      id: submissionId,
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

    // ✅ Kirim email notification ke merchant
    // Ambil merchant email dari settings
    try {
      const { data: shopSettings } = await db
        .from("shop_settings")
        .select("notification_email")
        .eq("shop", shopValue)
        .single();

      const merchantEmail = shopSettings?.notification_email;
      if (merchantEmail) {
        await sendSubmissionNotification({
          merchantEmail,
          orderName: "pending",
          customerEmail: customerEmail ?? "unknown",
          fileName,
          submissionId,
          shop: shopValue,
        });
      }
    } catch (emailErr) {
      console.error("Email error:", emailErr);
    }

    return NextResponse.json(
      { success: true, filePath, fileName },
      { headers },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500, headers });
  }
}

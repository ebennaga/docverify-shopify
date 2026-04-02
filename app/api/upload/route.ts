import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

const BUCKET = "doc-verifications";

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType, fileData, productIds } = await req.json();

    if (!fileName || !fileData) {
      return NextResponse.json({ error: "Missing file data" }, { status: 400 });
    }

    // Convert base64 ke Buffer
    const buffer = Buffer.from(fileData, "base64");

    // Generate unique path
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `uploads/${timestamp}-${cleanFileName}`;

    // Upload ke Supabase Storage
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      filePath,
      fileName,
    });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

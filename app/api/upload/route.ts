import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

const BUCKET = "doc-verifications";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { fileName, fileType, fileData, productIds } = await req.json();

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
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500, headers },
      );
    }

    return NextResponse.json(
      { success: true, filePath, fileName },
      { headers },
    );
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500, headers });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  console.log("[resubmit] id:", id);
  const body = await req.json();
  const { fileName, fileType, fileData } = body;
  console.log("[resubmit] fileName:", fileName, "fileType:", fileType);

  // Get existing submission
  const { data: submission, error: fetchError } = await db
    .from("doc_submissions")
    .select("*")
    .eq("id", id)
    .single();
  console.log("[resubmit] submission:", submission, "fetchError:", fetchError);
  if (fetchError || !submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  // Upload new file to Supabase Storage
  const buffer = Buffer.from(fileData, "base64");
  const ext = fileName.split(".").pop();
  const newPath = `${submission.shop}/${Date.now()}-resubmit.${ext}`;
  console.log("[resubmit] uploading to path:", newPath);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("doc-verifications")
    .upload(newPath, buffer, { contentType: fileType, upsert: false });

  console.log("[resubmit] uploadError:", uploadError);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Update submission: reset to pending with new file
  const { error: updateError } = await db
    .from("doc_submissions")
    .update({
      file_path: newPath,
      file_name: fileName,
      file_size: buffer.length,
      status: "pending",
      reviewer_note: null,
    })
    .eq("id", id);
  console.log("[resubmit] updateError:", updateError);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, filePath: newPath });
}

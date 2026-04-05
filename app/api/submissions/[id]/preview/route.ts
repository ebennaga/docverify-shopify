import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: submission } = await db
    .from("doc_submissions")
    .select("file_path")
    .eq("id", id)
    .single();

  if (!submission)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: signedUrl } = await db.storage
    .from("doc-verifications")
    .createSignedUrl(submission.file_path, 3600);

  return NextResponse.json({ url: signedUrl?.signedUrl });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await db
    .from("doc_submissions")
    .update({
      status: body.status,
      reviewer_note: body.reviewer_note,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

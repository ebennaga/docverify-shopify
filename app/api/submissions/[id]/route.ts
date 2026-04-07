import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sendVerifiedEmail, sendRejectedEmail } from "@/lib/email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const { status, reviewer_note } = body;

  const { data, error } = await db
    .from("doc_submissions")
    .update({
      status,
      reviewer_note,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Kirim email ke customer setelah review
  try {
    const { customer_email, order_name, file_name, shop } = data;

    if (customer_email && customer_email !== "unknown") {
      if (status === "verified") {
        await sendVerifiedEmail({
          customerEmail: customer_email,
          orderName: order_name ?? "your order",
          fileName: file_name,
          reviewerNote: reviewer_note ?? "",
          shop,
        });
      } else if (status === "rejected") {
        await sendRejectedEmail({
          customerEmail: customer_email,
          orderName: order_name ?? "your order",
          fileName: file_name,
          reviewerNote: reviewer_note ?? "",
          shop,
        });
      }
    }
  } catch (emailErr) {
    console.error("Customer email error:", emailErr);
    // Jangan fail kalau email gagal
  }

  return NextResponse.json(data);
}

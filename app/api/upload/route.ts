import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const productId = formData.get("product_id") as string;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(fileName, file);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage
    .from("uploads")
    .getPublicUrl(fileName);

  await supabase.from("uploads").insert({
    product_id: productId,
    file_url: publicUrl.publicUrl,
  });

  return NextResponse.json({
    success: true,
    url: publicUrl.publicUrl,
  });
}

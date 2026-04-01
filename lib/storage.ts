import { db } from "./supabase"; // ganti dari supabaseAdmin → db

const BUCKET = "doc-verifications";

export async function uploadDocument(
  file: Buffer,
  fileName: string,
  shopDomain: string,
  orderId: string,
): Promise<string> {
  const filePath = `${shopDomain}/${orderId}/${Date.now()}-${fileName}`;

  const { error } = await db.storage.from(BUCKET).upload(filePath, file, {
    contentType: "application/octet-stream",
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return filePath;
}

export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error || !data) throw new Error("Failed to generate signed URL");
  return data.signedUrl;
}

export async function deleteDocument(filePath: string): Promise<void> {
  await db.storage.from(BUCKET).remove([filePath]);
}

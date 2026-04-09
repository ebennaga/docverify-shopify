import { db } from "@/lib/supabase";
import { refreshAccessToken } from "@/lib/shopify";

export async function getValidAccessToken(shop: string): Promise<string | null> {
  const { data: session } = await db
    .from("Session")
    .select("access_token, refresh_token, expires_at")
    .eq("shop", shop)
    .single();

  if (!session?.access_token) return null;

  // Kalau tidak ada expires_at, token non-expiring — langsung return
  if (!session.expires_at) return session.access_token;

  const expiresAt = new Date(session.expires_at).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  // Token masih valid (lebih dari 5 menit sebelum expired)
  if (now < expiresAt - fiveMinutes) {
    return session.access_token;
  }

  // Token expired atau hampir expired — refresh
  if (!session.refresh_token) {
    console.log("[getValidAccessToken] token expired, no refresh token");
    return null;
  }

  console.log("[getValidAccessToken] refreshing token for shop:", shop);

  const newTokenData = await refreshAccessToken(shop, session.refresh_token);

  if (!newTokenData.access_token) {
    console.error("[getValidAccessToken] refresh failed:", newTokenData);
    return null;
  }

  const newExpiresAt = newTokenData.expires_in
    ? new Date(Date.now() + newTokenData.expires_in * 1000).toISOString()
    : null;

  // Simpan token baru ke database
  await db.from("Session").update({
    access_token: newTokenData.access_token,
    refresh_token: newTokenData.refresh_token ?? session.refresh_token,
    expires_at: newExpiresAt,
  }).eq("shop", shop);

  console.log("[getValidAccessToken] token refreshed successfully");
  return newTokenData.access_token;
}

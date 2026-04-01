export const shopifyConfig = {
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecret: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!,
  appUrl: process.env.SHOPIFY_APP_URL!,
};

export function getAuthUrl(shop: string, state: string): string {
  const redirectUri = `${shopifyConfig.appUrl}/api/auth/callback`;
  const scopes = shopifyConfig.scopes;
  return `https://${shop}/admin/oauth/authorize?client_id=${shopifyConfig.apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
}

export async function getAccessToken(
  shop: string,
  code: string,
): Promise<string> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: shopifyConfig.apiKey,
      client_secret: shopifyConfig.apiSecret,
      code,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export function validateHmac(params: URLSearchParams): boolean {
  const crypto = require("crypto");
  const hmac = params.get("hmac");
  if (!hmac) return false;

  const message = Array.from(params.entries())
    .filter(([key]) => key !== "hmac")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}=${val}`)
    .join("&");

  const digest = crypto
    .createHmac("sha256", shopifyConfig.apiSecret)
    .update(message)
    .digest("hex");

  return digest === hmac;
}

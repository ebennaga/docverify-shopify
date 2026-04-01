import { redirect } from "next/navigation";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; host?: string }>;
}) {
  const params = await searchParams;
  const { shop, host } = params;

  // Kalau tidak ada shop, redirect ke auth
  if (!shop) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>DocVerify</h1>
        <p>Please access this app from your Shopify admin.</p>
      </div>
    );
  }

  return (
    <html>
      <head>
        <title>DocVerify</title>
        <script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          data-api-key={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}
        />
      </head>
      <body>
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
          <h1>DocVerify Admin</h1>
          <p>Shop: {shop}</p>
          <p style={{ color: "green" }}>✅ App is working!</p>
          <nav style={{ marginTop: "20px" }}>
            <a
              href={`/admin/products?shop=${shop}&host=${host}`}
              style={{ marginRight: "16px" }}
            >
              Product Rules
            </a>
          </nav>
        </div>
      </body>
    </html>
  );
}

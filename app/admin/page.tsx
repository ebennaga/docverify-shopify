export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; host?: string }>;
}) {
  const params = await searchParams;
  const shop = params.shop;

  if (!shop) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>DocVerify Admin</h1>
        <p>Please access this app from your Shopify admin.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>DocVerify Admin</h1>
      <p>Shop: {shop}</p>
      <p>App is working!</p>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; host?: string }>;
}) {
  const params = await searchParams;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>DocVerify Admin</h1>
      {params.shop ? (
        <>
          <p>Shop: {params.shop}</p>
          <p style={{ color: "green" }}>✅ App is working!</p>
        </>
      ) : (
        <p>Please access this app from your Shopify admin.</p>
      )}
    </div>
  );
}

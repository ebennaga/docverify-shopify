export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; host?: string }>;
}) {
  const params = await searchParams;
  const shop = params.shop ?? "";
  const host = params.host ?? "";

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>DocVerify</h1>
      <nav style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
        <a
          href={`/admin/products?shop=${shop}&host=${host}`}
          style={{ color: "#3b82f6" }}
        >
          Product Rules
        </a>
        <a
          href={`/admin/submissions?shop=${shop}&host=${host}`}
          style={{ color: "#3b82f6" }}
        >
          Document Submissions
        </a>
      </nav>
    </div>
  );
}

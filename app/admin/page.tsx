import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; host?: string }>;
}) {
  const params = await searchParams;
  const shop = params.shop ?? "";
  const host = params.host ?? "";

  // Ambil stats
  const { data: submissions } = await db
    .from("doc_submissions")
    .select("status")
    .eq("shop", shop);

  const { data: rules } = await db
    .from("product_rules")
    .select("is_active")
    .eq("shop", shop);

  const stats = {
    total: submissions?.length ?? 0,
    pending: submissions?.filter((s) => s.status === "pending").length ?? 0,
    verified: submissions?.filter((s) => s.status === "verified").length ?? 0,
    rejected: submissions?.filter((s) => s.status === "rejected").length ?? 0,
    activeRules: rules?.filter((r) => r.is_active).length ?? 0,
    totalRules: rules?.length ?? 0,
  };

  const cards = [
    {
      label: "Total Submissions",
      value: stats.total,
      icon: "📄",
      color: "#3b82f6",
      bg: "#eff6ff",
      href: `/admin/submissions?shop=${shop}&host=${host}`,
    },
    {
      label: "Pending Review",
      value: stats.pending,
      icon: "⏳",
      color: "#d97706",
      bg: "#fffbeb",
      href: `/admin/submissions?shop=${shop}&host=${host}`,
    },
    {
      label: "Verified",
      value: stats.verified,
      icon: "✅",
      color: "#059669",
      bg: "#ecfdf5",
      href: `/admin/submissions?shop=${shop}&host=${host}`,
    },
    {
      label: "Active Rules",
      value: stats.activeRules,
      icon: "🔒",
      color: "#7c3aed",
      bg: "#f5f3ff",
      href: `/admin/products?shop=${shop}&host=${host}`,
    },
  ];

  return (
    <div
      style={{ padding: "24px", fontFamily: "sans-serif", maxWidth: "1100px" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
          Welcome to DocVerify 👋
        </h1>
        <p style={{ color: "#6b7280", marginTop: "6px", fontSize: "14px" }}>
          Manage document verification rules and review customer submissions.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {cards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            style={{
              background: card.bg,
              border: `1px solid ${card.color}30`,
              borderRadius: "12px",
              padding: "20px",
              textDecoration: "none",
              display: "block",
              transition: "transform 0.1s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>
              {card.icon}
            </div>
            <div
              style={{ fontSize: "28px", fontWeight: 700, color: card.color }}
            >
              {card.value}
            </div>
            <div
              style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}
            >
              {card.label}
            </div>
          </a>
        ))}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px" }}>
          Quick Actions
        </h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a
            href={`/admin/products?shop=${shop}&host=${host}`}
            style={{
              padding: "10px 20px",
              background: "#000",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            + Add Product Rule
          </a>
          <a
            href={`/admin/submissions?shop=${shop}&host=${host}`}
            style={{
              padding: "10px 20px",
              background: "white",
              color: "#374151",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid #d1d5db",
            }}
          >
            Review Submissions{" "}
            {stats.pending > 0 && `(${stats.pending} pending)`}
          </a>
          <a
            href={`/admin/settings?shop=${shop}&host=${host}`}
            style={{
              padding: "10px 20px",
              background: "white",
              color: "#374151",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid #d1d5db",
            }}
          >
            ⚙️ Settings
          </a>
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 16px" }}>
          Overview
        </h2>
        <div style={{ display: "flex", gap: "32px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
              Product rules
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 600 }}>
              {stats.activeRules} active / {stats.totalRules} total
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
              Submissions reviewed
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 600 }}>
              {stats.verified + stats.rejected} / {stats.total}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
              Approval rate
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "16px",
                fontWeight: 600,
                color: "#059669",
              }}
            >
              {stats.verified + stats.rejected > 0
                ? Math.round(
                    (stats.verified / (stats.verified + stats.rejected)) * 100,
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

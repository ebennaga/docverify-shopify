"use client";

import { useState, useCallback } from "react";

type Submission = {
  id: string;
  shop: string;
  order_id: string;
  order_name: string | null;
  customer_email: string | null;
  product_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  status: string;
  reviewer_note: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: { label: "Pending", color: "#d97706", bg: "#fffbeb", icon: "⏳" },
  verified: { label: "Verified", color: "#059669", bg: "#ecfdf5", icon: "✅" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fef2f2", icon: "❌" },
};

export default function SubmissionsClient({
  submissions: initial,
}: {
  submissions: Submission[];
}) {
  const [submissions, setSubmissions] = useState(initial);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const handlePreview = useCallback(async (sub: Submission) => {
    setSelected(sub);
    setNote(sub.reviewer_note ?? "");
    setPreviewUrl(null);
    const res = await fetch(`/api/submissions/${sub.id}/preview`);
    if (res.ok) {
      const data = await res.json();
      setPreviewUrl(data.url);
    }
  }, []);

  const handleReview = useCallback(
    async (status: "verified" | "rejected") => {
      if (!selected) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/submissions/${selected.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reviewer_note: note }),
        });
        if (res.ok) {
          setSubmissions((prev) =>
            prev.map((s) =>
              s.id === selected.id ? { ...s, status, reviewer_note: note } : s,
            ),
          );
          setSelected(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [selected, note],
  );

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    verified: submissions.filter((s) => s.status === "verified").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      color: "#6b7280",
      bg: "#f9fafb",
      key: "all",
    },
    {
      label: "Pending",
      value: stats.pending,
      color: "#d97706",
      bg: "#fffbeb",
      key: "pending",
    },
    {
      label: "Verified",
      value: stats.verified,
      color: "#059669",
      bg: "#ecfdf5",
      key: "verified",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      color: "#dc2626",
      bg: "#fef2f2",
      key: "rejected",
    },
  ];

  const filtered =
    filter === "all"
      ? submissions
      : submissions.filter((s) => s.status === filter);

  return (
    <div
      style={{ padding: "24px", fontFamily: "sans-serif", maxWidth: "1100px" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
          Document Submissions
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px" }}>
          Review and manage customer document uploads.
        </p>
      </div>

      {/* Stats Cards — clickable as filter */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => setFilter(card.key)}
            style={{
              background: card.bg,
              border: `2px solid ${filter === card.key ? card.color : `${card.color}20`}`,
              borderRadius: "10px",
              padding: "16px 20px",
              textAlign: "left",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
              {card.label}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "28px",
                fontWeight: 700,
                color: card.color,
              }}
            >
              {card.value}
            </p>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "white",
            border: "2px dashed #e5e7eb",
            borderRadius: "12px",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📭</div>
          <p style={{ fontWeight: 600, fontSize: "16px", margin: "0 0 6px" }}>
            No submissions
          </p>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            {filter === "all"
              ? "No documents have been submitted yet."
              : `No ${filter} submissions.`}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#fafafa",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {["Order", "Customer", "File", "Status", "Date", "Action"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const st = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pending;
                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom:
                        i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>
                        {s.order_name ?? s.order_id}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "#6b7280",
                        fontSize: "13px",
                      }}
                    >
                      {s.customer_email ?? (
                        <span style={{ color: "#d1d5db", fontStyle: "italic" }}>
                          No email
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#374151",
                          maxWidth: "160px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        📎 {s.file_name}
                      </div>
                      {s.file_size && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#9ca3af",
                            marginTop: "2px",
                          }}
                        >
                          {(s.file_size / 1024).toFixed(0)} KB
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: st.bg,
                          color: st.color,
                        }}
                      >
                        {st.icon} {st.label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      {new Date(s.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => handlePreview(s)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: "white",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#374151",
                        }}
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "580px",
              maxHeight: "85vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Review Document
                </h2>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "13px",
                    margin: "4px 0 0",
                  }}
                >
                  {selected.order_name ?? selected.order_id}
                  {selected.customer_email && ` · ${selected.customer_email}`}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                  color: "#9ca3af",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Current status badge */}
              {(() => {
                const st =
                  STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.pending;
                return (
                  <div style={{ marginBottom: "16px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        background: st.bg,
                        color: st.color,
                      }}
                    >
                      {st.icon} {st.label}
                    </span>
                  </div>
                );
              })()}

              {/* File Preview */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  height: "280px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                  background: "#f9fafb",
                  overflow: "hidden",
                }}
              >
                {previewUrl ? (
                  selected.file_name.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                    <img
                      src={previewUrl}
                      alt="document"
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <iframe
                      src={previewUrl}
                      style={{ width: "100%", height: "100%", border: "none" }}
                    />
                  )
                ) : (
                  <div style={{ textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                      ⏳
                    </div>
                    <p style={{ margin: 0, fontSize: "14px" }}>
                      Loading preview...
                    </p>
                  </div>
                )}
              </div>

              <a
                href={previewUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "13px",
                  color: "#3b82f6",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginBottom: "20px",
                  textDecoration: "none",
                }}
              >
                📎 Open full file in new tab ↗
              </a>

              {/* Reviewer note */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Reviewer note{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                    (optional — sent to customer)
                  </span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                    boxSizing: "border-box",
                    color: "#111",
                    fontFamily: "inherit",
                  }}
                  placeholder="E.g. Document is valid. / Please resubmit with a clearer image."
                />
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    padding: "10px 20px",
                    cursor: "pointer",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    background: "white",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#374151",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview("rejected")}
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    cursor: loading ? "not-allowed" : "pointer",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  ❌ Reject
                </button>
                <button
                  onClick={() => handleReview("verified")}
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    cursor: loading ? "not-allowed" : "pointer",
                    background: "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Saving..." : "✅ Verify"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

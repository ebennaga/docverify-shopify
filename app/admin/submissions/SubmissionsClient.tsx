"use client";

import { useState, useCallback, useMemo } from "react";

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
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter + search
  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchFilter = filter === "all" || s.status === filter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (s.order_name ?? s.order_id).toLowerCase().includes(q) ||
        (s.customer_email ?? "").toLowerCase().includes(q) ||
        s.file_name.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [submissions, filter, search]);

  // Select all in current view
  const allSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Bulk review
  const handleBulkReview = async (status: "verified" | "rejected") => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `${status === "verified" ? "Verify" : "Reject"} ${selectedIds.size} submission(s)?`,
      )
    )
      return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/submissions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, reviewer_note: "" }),
          }),
        ),
      );
      setSubmissions((prev) =>
        prev.map((s) => (selectedIds.has(s.id) ? { ...s, status } : s)),
      );
      setSelectedIds(new Set());
      showToast(`${selectedIds.size} submission(s) ${status}.`);
    } catch {
      showToast("Bulk action failed.", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ["Order", "Customer", "File", "Status", "Date", "Reviewer Note"],
      ...filtered.map((s) => [
        s.order_name ?? s.order_id,
        s.customer_email ?? "",
        s.file_name,
        s.status,
        new Date(s.created_at).toLocaleDateString("en-GB"),
        s.reviewer_note ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Single review modal
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
          showToast(`Submission ${status}.`);
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

  return (
    <div
      style={{ padding: "24px", fontFamily: "sans-serif", maxWidth: "1100px" }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "10px",
            background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${toast.type === "error" ? "#fecaca" : "#bbf7d0"}`,
            color: toast.type === "error" ? "#b91c1c" : "#15803d",
            fontSize: "14px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            {toast.type === "success" ? "✅" : "⚠️"} {toast.msg}
          </span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
            Document Submissions
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px" }}>
            Review and manage customer document uploads.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            padding: "9px 18px",
            cursor: "pointer",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            background: "white",
            fontSize: "13px",
            fontWeight: 500,
            color: "#374151",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ⬇️ Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => {
              setFilter(card.key);
              setSelectedIds(new Set());
            }}
            style={{
              background: card.bg,
              border: `2px solid ${filter === card.key ? card.color : `${card.color}20`}`,
              borderRadius: "10px",
              padding: "16px 20px",
              textAlign: "left",
              cursor: "pointer",
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

      {/* Search + Bulk Actions Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIds(new Set());
          }}
          placeholder="🔍 Search by order, email, or file name..."
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
          }}
        />
        {someSelected && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span
              style={{
                fontSize: "13px",
                color: "#6b7280",
                whiteSpace: "nowrap",
              }}
            >
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => handleBulkReview("verified")}
              disabled={bulkLoading}
              style={{
                padding: "9px 16px",
                cursor: "pointer",
                background: "#059669",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              ✅ Verify all
            </button>
            <button
              onClick={() => handleBulkReview("rejected")}
              disabled={bulkLoading}
              style={{
                padding: "9px 16px",
                cursor: "pointer",
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              ❌ Reject all
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                padding: "9px 12px",
                cursor: "pointer",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                background: "white",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              ✕
            </button>
          </div>
        )}
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
            No submissions found
          </p>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            {search
              ? `No results for "${search}"`
              : filter === "all"
                ? "No documents submitted yet."
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
                {/* Checkbox all */}
                <th style={{ padding: "12px 16px", width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />
                </th>
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
                const isChecked = selectedIds.has(s.id);
                return (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom:
                        i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                      background: isChecked ? "#f0fdf4" : "white",
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(s.id)}
                        style={{
                          cursor: "pointer",
                          width: "16px",
                          height: "16px",
                        }}
                      />
                    </td>
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
                📎 Open full file ↗
              </a>

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

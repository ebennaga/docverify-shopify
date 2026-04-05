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

  const statusColor: Record<string, string> = {
    pending: "#f59e0b",
    verified: "#10b981",
    rejected: "#ef4444",
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "20px" }}>Document Submissions</h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            {["Order", "Customer", "File", "Status", "Date", "Action"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {submissions.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                No submissions yet
              </td>
            </tr>
          ) : (
            submissions.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 12px" }}>
                  {s.order_name ?? s.order_id}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  {s.customer_email ?? "-"}
                </td>
                <td style={{ padding: "10px 12px", fontSize: "13px" }}>
                  {s.file_name}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: `${statusColor[s.status]}20`,
                      color: statusColor[s.status],
                    }}
                  >
                    {s.status}
                  </span>
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    onClick={() => handlePreview(s)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      background: "white",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Review Modal */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              width: "560px",
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <h2 style={{ marginBottom: "4px" }}>Review Document</h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              Order: {selected.order_name ?? selected.order_id} ·{" "}
              {selected.customer_email}
            </p>

            {/* File Preview */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                height: "280px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                background: "#f9fafb",
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
                <p style={{ color: "#9ca3af" }}>Loading preview...</p>
              )}
            </div>

            <a
              href={previewUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "13px",
                color: "#3b82f6",
                display: "block",
                marginBottom: "16px",
              }}
            >
              Open full file ↗
            </a>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                Reviewer note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
                placeholder="Add a note for this review..."
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setSelected(null)}
                style={{ padding: "8px 16px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview("rejected")}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  background: "#fee2e2",
                  color: "#b91c1c",
                  border: "1px solid #fca5a5",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Reject
              </button>
              <button
                onClick={() => handleReview("verified")}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Saving..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

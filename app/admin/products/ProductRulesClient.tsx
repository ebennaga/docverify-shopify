"use client";

import { useState, useCallback } from "react";

type Rule = {
  id: string;
  product_id: string | null;
  product_title: string | null;
  doc_type: string;
  is_active: boolean;
};

type Props = {
  rules: Rule[];
};

export default function ProductRulesClient({ rules: initialRules }: Props) {
  const [rules, setRules] = useState(initialRules);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    productId: "",
    productTitle: "",
    docType: "prescription",
    uploadTitle: "Please upload your document to proceed",
    helperText: "Your file is securely stored with your order.",
    errorMessage: "This product requires a valid document to purchase.",
  });

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/product-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setRules((prev) => [data, ...prev]);
      setModalOpen(false);
      setToast("Rule saved!");
    } catch {
      setToast("Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [form]);

  const handleToggle = useCallback(async (id: string, current: boolean) => {
    await fetch(`/api/product-rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r)),
    );
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      {toast && (
        <div
          style={{
            background: "#e6f4ea",
            padding: "10px",
            marginBottom: "16px",
            borderRadius: "8px",
          }}
        >
          {toast}
          <button onClick={() => setToast("")} style={{ marginLeft: "8px" }}>
            ×
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1>Product rules</h1>
        <button
          onClick={() => setModalOpen(true)}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          + Add rule
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
            <th style={{ textAlign: "left", padding: "8px" }}>Product</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Document type</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{ padding: "16px", textAlign: "center", color: "#888" }}
              >
                No rules yet
              </td>
            </tr>
          ) : (
            rules.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "8px" }}>
                  {r.product_title ?? r.product_id ?? "-"}
                </td>
                <td style={{ padding: "8px" }}>
                  {r.doc_type.replace("_", " ")}
                </td>
                <td style={{ padding: "8px" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: r.is_active ? "#e6f4ea" : "#f0f0f0",
                      color: r.is_active ? "#2e7d32" : "#888",
                      fontSize: "12px",
                    }}
                  >
                    {r.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "8px" }}>
                  <button
                    onClick={() => handleToggle(r.id, r.is_active)}
                    style={{
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {r.is_active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "480px",
            }}
          >
            <h2 style={{ marginBottom: "16px" }}>Add product rule</h2>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "13px",
                }}
              >
                Shopify product ID
              </label>
              <input
                value={form.productId}
                onChange={(e) =>
                  setForm({ ...form, productId: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
                placeholder="gid://shopify/Product/123456789"
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "13px",
                }}
              >
                Product name
              </label>
              <input
                value={form.productTitle}
                onChange={(e) =>
                  setForm({ ...form, productTitle: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "13px",
                }}
              >
                Document type
              </label>
              <select
                value={form.docType}
                onChange={(e) => setForm({ ...form, docType: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              >
                <option value="prescription">Prescription</option>
                <option value="age_certificate">Age certificate</option>
                <option value="confirmation_letter">Confirmation letter</option>
              </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "13px",
                }}
              >
                Upload prompt title
              </label>
              <input
                value={form.uploadTitle}
                onChange={(e) =>
                  setForm({ ...form, uploadTitle: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "13px",
                }}
              >
                Helper text
              </label>
              <input
                value={form.helperText}
                onChange={(e) =>
                  setForm({ ...form, helperText: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "13px",
                }}
              >
                Error message
              </label>
              <input
                value={form.errorMessage}
                onChange={(e) =>
                  setForm({ ...form, errorMessage: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
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
                onClick={() => setModalOpen(false)}
                style={{ padding: "8px 16px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  cursor: "pointer",
                  background: "#000",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                {saving ? "Saving..." : "Save rule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

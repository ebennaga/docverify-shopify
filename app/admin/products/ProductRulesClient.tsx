"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Rule = {
  id: string;
  product_id: string | null;
  product_title: string | null;
  doc_type: string;
  is_active: boolean;
};

type Product = {
  id: string;
  title: string;
  image: string | null;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  prescription: "💊 Prescription",
  age_certificate: "🪪 Age Certificate",
  confirmation_letter: "📋 Confirmation Letter",
};

export default function ProductRulesClient({
  rules: initialRules,
}: {
  rules: Rule[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    docType: "prescription",
    uploadTitle: "Please upload your document to proceed",
    helperText: "Your file is securely stored with your order.",
    errorMessage: "This product requires a valid document to purchase.",
  });

  const shop =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("shop") ?? "")
      : "";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setSelectedProduct(null);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setSearchResults([]);
        setDropdownOpen(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const res = await fetch(
            `/api/products/search?shop=${shop}&q=${encodeURIComponent(value)}`,
          );
          const data = await res.json();
          setSearchResults(data);
          setDropdownOpen(true);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, 400);
    },
    [shop],
  );

  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.title);
    setDropdownOpen(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedProduct) {
      setToast({ msg: "Please select a product first.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/product-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productTitle: selectedProduct.title,
          shop,
          ...form,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const data = await res.json();
      setRules((prev) => [data, ...prev]);
      setModalOpen(false);
      setSelectedProduct(null);
      setSearchQuery("");
      setToast({ msg: "Rule saved successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ msg: `Failed to save: ${err}`, type: "error" });
    } finally {
      setSaving(false);
    }
  }, [selectedProduct, form, shop]);

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
  const handleDelete = useCallback(async (id: string, title: string) => {
    if (!confirm(`Delete rule for "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/product-rules/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRules((prev) => prev.filter((r) => r.id !== id));
      setToast({ msg: "Rule deleted.", type: "success" });
      setTimeout(() => setToast(null), 3000);
    }
  }, []);

  const openModal = () => {
    setSelectedProduct(null);
    setSearchQuery("");
    setSearchResults([]);
    setModalOpen(true);
  };

  const activeCount = rules.filter((r) => r.is_active).length;

  return (
    <div
      style={{ padding: "24px", fontFamily: "sans-serif", maxWidth: "1000px" }}
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
            alignItems: "center",
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
              fontSize: "18px",
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
            Product Rules
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px" }}>
            {rules.length === 0
              ? "No rules yet — add one to require document verification."
              : `${rules.length} rule${rules.length > 1 ? "s" : ""} · ${activeCount} active`}
          </p>
        </div>
        <button
          onClick={openModal}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            background: "#000",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          + Add rule
        </button>
      </div>

      {/* Empty state */}
      {rules.length === 0 ? (
        <div
          style={{
            background: "white",
            border: "2px dashed #e5e7eb",
            borderRadius: "12px",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔒</div>
          <p style={{ fontWeight: 600, fontSize: "16px", margin: "0 0 6px" }}>
            No product rules yet
          </p>
          <p
            style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}
          >
            Add a rule to require customers to upload a document before
            purchasing a product.
          </p>
          <button
            onClick={openModal}
            style={{
              padding: "10px 20px",
              background: "#000",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add first rule
          </button>
        </div>
      ) : (
        /* Table */
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
                {["Product", "Document type", "Status", "Action"].map((h) => (
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
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom:
                      i < rules.length - 1 ? "1px solid #f3f4f6" : "none",
                    transition: "background 0.1s",
                  }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "#111",
                      }}
                    >
                      {r.product_title ?? r.product_id ?? "-"}
                    </div>
                    {r.product_id && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9ca3af",
                          marginTop: "2px",
                        }}
                      >
                        ID: {r.product_id.split("/").pop()}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#374151",
                        background: "#f3f4f6",
                        padding: "4px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      {DOC_TYPE_LABELS[r.doc_type] ??
                        r.doc_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: r.is_active ? "#dcfce7" : "#f3f4f6",
                        color: r.is_active ? "#16a34a" : "#6b7280",
                      }}
                    >
                      {r.is_active ? "● Active" : "○ Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleToggle(r.id, r.is_active)}
                        style={{
                          padding: "6px 14px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 500,
                          border: `1px solid ${r.is_active ? "#fca5a5" : "#d1d5db"}`,
                          borderRadius: "6px",
                          background: r.is_active ? "#fef2f2" : "white",
                          color: r.is_active ? "#dc2626" : "#374151",
                        }}
                      >
                        {r.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(
                            r.id,
                            r.product_title ?? r.product_id ?? "this rule",
                          )
                        }
                        style={{
                          padding: "6px 10px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 500,
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          background: "white",
                          color: "#9ca3af",
                        }}
                        title="Delete rule"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "500px",
              maxHeight: "88vh",
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
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Add product rule
              </h2>
              <button
                onClick={() => setModalOpen(false)}
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
              {/* Product Search */}
              <div style={{ marginBottom: "20px" }} ref={searchRef}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Product *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by product name..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      boxSizing: "border-box",
                      border: selectedProduct
                        ? "2px solid #16a34a"
                        : "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                  {searching && (
                    <span
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "11px",
                        fontSize: "12px",
                        color: "#9ca3af",
                      }}
                    >
                      Searching...
                    </span>
                  )}
                  {selectedProduct && (
                    <span
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "11px",
                        color: "#16a34a",
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </span>
                  )}

                  {dropdownOpen && searchResults.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        marginTop: "4px",
                        overflow: "hidden",
                      }}
                    >
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f9fafb")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "white")
                          }
                        >
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              style={{
                                width: "38px",
                                height: "38px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "38px",
                                height: "38px",
                                background: "#f3f4f6",
                                borderRadius: "6px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "18px",
                              }}
                            >
                              📦
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 500 }}>
                              {p.title}
                            </div>
                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                              ID: {p.id.split("/").pop()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {dropdownOpen && searchResults.length === 0 && !searching && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        padding: "16px 14px",
                        color: "#9ca3af",
                        fontSize: "14px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        marginTop: "4px",
                        textAlign: "center",
                      }}
                    >
                      No products found
                    </div>
                  )}
                </div>
                {selectedProduct && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "12px",
                      color: "#16a34a",
                    }}
                  >
                    ✓ {selectedProduct.title}
                  </p>
                )}
              </div>

              {/* Document type */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Document type *
                </label>
                <select
                  value={form.docType}
                  onChange={(e) =>
                    setForm({ ...form, docType: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    background: "white",
                  }}
                >
                  <option value="prescription">💊 Prescription</option>
                  <option value="age_certificate">🪪 Age Certificate</option>
                  <option value="confirmation_letter">
                    📋 Confirmation Letter
                  </option>
                </select>
              </div>

              {/* Divider */}
              <div
                style={{ borderTop: "1px solid #f3f4f6", margin: "20px 0" }}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  margin: "0 0 16px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Checkout messages
              </p>

              {[
                {
                  label: "Upload prompt title",
                  key: "uploadTitle",
                  placeholder: "Please upload your document to proceed",
                },
                {
                  label: "Helper text",
                  key: "helperText",
                  placeholder: "Your file is securely stored with your order.",
                },
                {
                  label: "Error message",
                  key: "errorMessage",
                  placeholder:
                    "This product requires a valid document to purchase.",
                },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ marginBottom: "14px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    {label}
                  </label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      color: "#111",
                    }}
                  />
                </div>
              ))}

              {/* Modal actions */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  marginTop: "24px",
                }}
              >
                <button
                  onClick={() => setModalOpen(false)}
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
                  onClick={handleSave}
                  disabled={saving || !selectedProduct}
                  style={{
                    padding: "10px 20px",
                    cursor:
                      saving || !selectedProduct ? "not-allowed" : "pointer",
                    background: !selectedProduct ? "#9ca3af" : "#000",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {saving ? "Saving..." : "Save rule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

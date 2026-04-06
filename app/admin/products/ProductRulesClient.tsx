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

export default function ProductRulesClient({
  rules: initialRules,
}: {
  rules: Rule[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Product search state
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
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
      setToast("Please select a product first.");
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
      setToast("Rule saved!");
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setToast(`Failed: ${err}`);
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

  const openModal = () => {
    setSelectedProduct(null);
    setSearchQuery("");
    setSearchResults([]);
    setModalOpen(true);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      {toast && (
        <div
          style={{
            background: toast.startsWith("Failed") ? "#fee2e2" : "#e6f4ea",
            color: toast.startsWith("Failed") ? "#b91c1c" : "#2e7d32",
            padding: "10px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {toast}
          <button
            onClick={() => setToast("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ×
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>Product Rules</h1>
        <button
          onClick={openModal}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            background: "#000",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
          }}
        >
          + Add rule
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            {["Product", "Document type", "Status", "Action"].map((h) => (
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
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                No rules yet
              </td>
            </tr>
          ) : (
            rules.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                  {r.product_title ?? r.product_id ?? "-"}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "#6b7280",
                    textTransform: "capitalize",
                  }}
                >
                  {r.doc_type.replace(/_/g, " ")}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: r.is_active ? "#dcfce7" : "#f3f4f6",
                      color: r.is_active ? "#16a34a" : "#6b7280",
                    }}
                  >
                    {r.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    onClick={() => handleToggle(r.id, r.is_active)}
                    style={{
                      padding: "4px 12px",
                      cursor: "pointer",
                      fontSize: "12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      background: "white",
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

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
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
              borderRadius: "12px",
              width: "480px",
              maxHeight: "85vh",
              overflow: "auto",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
              Add product rule
            </h2>

            {/* Product Search */}
            <div style={{ marginBottom: "16px" }} ref={searchRef}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Search product
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Type product name..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    boxSizing: "border-box",
                    border: selectedProduct
                      ? "2px solid #16a34a"
                      : "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                {searching && (
                  <span
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "10px",
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
                      top: "10px",
                      color: "#16a34a",
                    }}
                  >
                    ✓
                  </span>
                )}

                {/* Dropdown */}
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
                      borderRadius: "8px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
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
                          gap: "10px",
                          transition: "background 0.1s",
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
                              width: "36px",
                              height: "36px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid #e5e7eb",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              background: "#f3f4f6",
                              borderRadius: "4px",
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
                            {p.id.split("/").pop()}
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
                      borderRadius: "8px",
                      padding: "12px 14px",
                      color: "#9ca3af",
                      fontSize: "14px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                      marginTop: "4px",
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
                  ✓ Selected: {selectedProduct.title}
                </p>
              )}
            </div>

            {/* Document type */}
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Document type
              </label>
              <select
                value={form.docType}
                onChange={(e) => setForm({ ...form, docType: e.target.value })}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              >
                <option value="prescription">Prescription</option>
                <option value="age_certificate">Age certificate</option>
                <option value="confirmation_letter">Confirmation letter</option>
              </select>
            </div>

            {/* Other fields */}
            {[
              { label: "Upload prompt title", key: "uploadTitle" },
              { label: "Helper text", key: "helperText" },
              { label: "Error message", key: "errorMessage" },
            ].map(({ label, key }) => (
              <div key={key} style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {label}
                </label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: "8px 16px",
                  cursor: "pointer",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "white",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedProduct}
                style={{
                  padding: "8px 16px",
                  cursor:
                    saving || !selectedProduct ? "not-allowed" : "pointer",
                  background: !selectedProduct ? "#9ca3af" : "#000",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
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

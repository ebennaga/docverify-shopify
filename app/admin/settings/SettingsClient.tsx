"use client";

import { useState, useEffect } from "react";

type Settings = {
  notification_email: string | null;
};

export default function SettingsClient({
  settings,
  shop: shopProp,
}: {
  settings: Settings | null;
  shop: string;
}) {
  const [email, setEmail] = useState(settings?.notification_email ?? "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [shop, setShop] = useState(shopProp);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("shop");
    if (fromUrl) setShop(fromUrl);
  }, []);

  const handleSave = async () => {
    if (!shop) {
      setToast({ msg: "Error: shop not found. Please reload.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, notificationEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setToast({ msg: "Settings saved successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ msg: `Failed to save: ${err}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "560px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px" }}>
          Configure notifications and preferences for your store.
        </p>
      </div>

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
            alignItems: "center",
            gap: "8px",
          }}
        >
          {toast.type === "success" ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* Card */}
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Section header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f3f4f6",
            background: "#fafafa",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 600,
              color: "#111",
            }}
          >
            📧 Email Notifications
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
            Get notified when customers submit documents for review.
          </p>
        </div>

        <div style={{ padding: "20px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#374151",
            }}
          >
            Notification email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="merchant@example.com"
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
              color: "#111",
              outline: "none",
            }}
          />
          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "6px" }}>
            You'll receive an email every time a customer submits a document.
          </p>
        </div>
      </div>

      {/* Store info */}
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
          marginTop: "16px",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f3f4f6",
            background: "#fafafa",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 600,
              color: "#111",
            }}
          >
            🏪 Store Info
          </p>
        </div>
        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "13px", color: "#6b7280" }}>
              Connected store
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#111",
                background: "#f3f4f6",
                padding: "4px 10px",
                borderRadius: "6px",
              }}
            >
              {shop || "Not detected"}
            </span>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "11px 24px",
            background: saving ? "#9ca3af" : "#000",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}

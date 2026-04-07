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
  const [toast, setToast] = useState("");
  const [shop, setShop] = useState(shopProp);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("shop");
    if (fromUrl) setShop(fromUrl);
  }, []);

  const handleSave = async () => {
    if (!shop) {
      setToast("Error: shop not found. Coba reload halaman.");
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

      setToast("Settings saved!");
      setTimeout(() => setToast(""), 3000);
    } catch (err) {
      setToast(`Failed: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "480px" }}>
      <h1 style={{ marginBottom: "4px" }}>Settings</h1>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
        Configure notifications for your store.
      </p>

      {toast && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background:
              toast.startsWith("Failed") || toast.startsWith("Error")
                ? "#fee2e2"
                : "#dcfce7",
            color:
              toast.startsWith("Failed") || toast.startsWith("Error")
                ? "#b91c1c"
                : "#16a34a",
            fontSize: "14px",
          }}
        >
          {toast}
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 500,
            marginBottom: "6px",
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
            padding: "9px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
        <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "6px" }}>
          You'll receive an email every time a customer submits a document.
        </p>
      </div>

      {/* Debug info — hapus setelah beres */}
      <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px" }}>
        Shop: {shop || "not detected"}
      </p>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: "9px 20px",
          background: shop ? "#000" : "#9ca3af",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: saving ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        {saving ? "Saving..." : "Save settings"}
      </button>
    </div>
  );
}

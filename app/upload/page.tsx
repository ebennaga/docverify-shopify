"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return") ?? "";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum 10MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData: base64,
          productIds: [],
        }),
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      if (returnUrl) {
        const separator = returnUrl.includes("?") ? "&" : "?";
        const redirectUrl = `${returnUrl}${separator}doc_code=${encodeURIComponent(data.filePath)}&doc_name=${encodeURIComponent(file.name)}`;
        window.location.href = redirectUrl;
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: "sans-serif",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Upload document</h1>
      <p style={{ color: "#666", marginBottom: "32px", fontSize: "14px" }}>
        Upload your prescription, age certificate, or confirmation letter. You
        will be redirected back to checkout after uploading.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleUpload}
        style={{ display: "none" }}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          width: "100%",
          padding: "16px",
          background: uploading ? "#ccc" : "#000",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: uploading ? "not-allowed" : "pointer",
          marginBottom: "12px",
        }}
      >
        {uploading ? "Uploading..." : "Select file to upload"}
      </button>

      <p style={{ fontSize: "12px", color: "#999", textAlign: "center" }}>
        PDF, JPG, PNG, WebP — max 10MB
      </p>

      {error && (
        <p style={{ color: "red", marginTop: "12px", fontSize: "14px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div style={{ padding: "24px" }}>Loading...</div>}>
      <UploadForm />
    </Suspense>
  );
}

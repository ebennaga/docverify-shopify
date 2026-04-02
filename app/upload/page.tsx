"use client";

import { useState, useRef } from "react";

export default function UploadPage({
  searchParams,
}: {
  searchParams: { callback?: string };
}) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const confirmCode = data.filePath;
      setCode(confirmCode);
      setUploaded(true);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "40px auto",
        padding: "24px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>Upload your document</h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Upload your prescription, age certificate, or confirmation letter. After
        uploading, copy the confirmation code and paste it back in checkout.
      </p>

      {!uploaded ? (
        <div>
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
              padding: "12px",
              background: "#000",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading..." : "Select file to upload"}
          </button>
          {error && <p style={{ color: "red", marginTop: "8px" }}>{error}</p>}
        </div>
      ) : (
        <div>
          <div
            style={{
              background: "#e6f4ea",
              border: "1px solid #2e7d32",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                color: "#2e7d32",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              Document uploaded successfully!
            </p>
            <p style={{ color: "#555", marginBottom: "8px" }}>
              Copy this confirmation code and paste it in the checkout page:
            </p>
            <div
              style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "4px",
                padding: "8px",
                fontFamily: "monospace",
                fontSize: "12px",
                wordBreak: "break-all",
              }}
            >
              {code}
            </div>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            style={{
              width: "100%",
              padding: "12px",
              background: "#185FA5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Copy confirmation code
          </button>
        </div>
      )}
    </div>
  );
}

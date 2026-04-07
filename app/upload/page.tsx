"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return") ?? "";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!email || !email.includes("@")) {
      setError("Please enter your email address first.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum 10MB.");
      return;
    }

    setUploading(true);
    setError("");
    setFileName(file.name);

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
          productIds:
            new URLSearchParams(window.location.search)
              .get("productIds")
              ?.split(",") ?? [],
          shop:
            new URLSearchParams(window.location.search).get("shop") ??
            "unknown",
          customerEmail: email,
        }),
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      if (returnUrl) {
        const separator = returnUrl.includes("?") ? "&" : "?";
        window.location.href = `${returnUrl}${separator}doc_code=${encodeURIComponent(data.filePath)}&doc_name=${encodeURIComponent(file.name)}`;
      } else {
        setCode(data.filePath);
        setUploaded(true);
        setUploading(false);
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "40px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "#000",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "24px",
            }}
          >
            🔒
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              margin: 0,
              color: "#111",
            }}
          >
            Document Verification
          </h1>
          <p
            style={{
              color: "#6b7280",
              marginTop: "8px",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Please upload your document to proceed with your purchase.
          </p>
        </div>

        {uploaded ? (
          /* Success State */
          <div>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>✅</div>
              <p
                style={{
                  color: "#15803d",
                  fontWeight: 600,
                  margin: 0,
                  fontSize: "16px",
                }}
              >
                Upload successful!
              </p>
              <p
                style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}
              >
                {fileName}
              </p>
            </div>

            <p
              style={{
                fontSize: "14px",
                color: "#374151",
                marginBottom: "12px",
                fontWeight: 500,
              }}
            >
              Copy this code and paste it in checkout:
            </p>

            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "12px 16px",
                fontFamily: "monospace",
                fontSize: "12px",
                wordBreak: "break-all",
                color: "#374151",
                marginBottom: "12px",
                lineHeight: 1.6,
              }}
            >
              {code}
            </div>

            <button
              onClick={handleCopy}
              style={{
                width: "100%",
                padding: "14px",
                background: copied ? "#059669" : "#000",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {copied ? "✓ Copied!" : "Copy confirmation code"}
            </button>

            <p
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                textAlign: "center",
                marginTop: "16px",
              }}
            >
              Return to checkout and paste this code to continue.
            </p>
          </div>
        ) : (
          /* Upload Form */
          <div>
            {/* Email */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "#374151",
                }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  outline: "none",
                  color: "#111",
                }}
              />
              <p
                style={{ fontSize: "12px", color: "#9ca3af", marginTop: "6px" }}
              >
                We'll notify you when your document is reviewed.
              </p>
            </div>

            {/* Upload Button */}
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
                padding: "14px",
                background: uploading ? "#9ca3af" : "#000",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: uploading ? "not-allowed" : "pointer",
                marginBottom: "12px",
              }}
            >
              {uploading ? (
                <span>⏳ Uploading...</span>
              ) : (
                <span>📎 Select file to upload</span>
              )}
            </button>

            <p
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                textAlign: "center",
              }}
            >
              PDF, JPG, PNG, WebP — max 10MB
            </p>

            {error && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#b91c1c",
                  fontSize: "14px",
                }}
              >
                ⚠️ {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
            color: "#9ca3af",
          }}
        >
          Loading...
        </div>
      }
    >
      <UploadForm />
    </Suspense>
  );
}

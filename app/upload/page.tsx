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
  const isResubmit = searchParams.get("resubmit") === "true";
  const submissionId = searchParams.get("submissionId") ?? "";
  const rejectionNote = searchParams.get("note") ?? "";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isResubmit && (!email || !email.includes("@"))) {
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

      const params = new URLSearchParams(window.location.search);

      // Resubmit: PATCH existing submission
      if (isResubmit && submissionId) {
        const res = await fetch(`/api/submissions/${submissionId}/resubmit`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileData: base64,
          }),
        });
        if (!res.ok) throw new Error("Resubmit failed");
        const data = await res.json();
        setCode(data.filePath ?? submissionId);
        setUploaded(true);
        setUploading(false);
        return;
      }

      // Normal upload
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData: base64,
          productIds: params.get("productIds")?.split(",") ?? [],
          shop: params.get("shop") ?? "unknown",
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
    } catch {
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
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              background: isResubmit ? "#dc2626" : "#000",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "24px",
            }}
          >
            {isResubmit ? "🔄" : "🔒"}
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              margin: 0,
              color: "#111",
            }}
          >
            {isResubmit ? "Resubmit Document" : "Document Verification"}
          </h1>
          <p
            style={{
              color: "#6b7280",
              marginTop: "8px",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            {isResubmit
              ? "Your previous document was rejected. Please upload a new one."
              : "Please upload your document to proceed with your purchase."}
          </p>
        </div>

        {/* Rejection note banner — only for resubmit */}
        {isResubmit && rejectionNote && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                fontWeight: 600,
                color: "#dc2626",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Reason for rejection
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "14px",
                color: "#7f1d1d",
                lineHeight: 1.5,
              }}
            >
              {rejectionNote}
            </p>
          </div>
        )}

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
                {isResubmit ? "Resubmission successful!" : "Upload successful!"}
              </p>
              <p
                style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}
              >
                {fileName}
              </p>
            </div>

            {!isResubmit && (
              <>
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
              </>
            )}

            {isResubmit && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Our team will review your document and notify you via email once
                it's verified.
              </p>
            )}
          </div>
        ) : (
          /* Upload Form */
          <div>
            {/* Email — only for non-resubmit */}
            {!isResubmit && (
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
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    marginTop: "6px",
                  }}
                >
                  We'll notify you when your document is reviewed.
                </p>
              </div>
            )}

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
                background: uploading
                  ? "#9ca3af"
                  : isResubmit
                    ? "#dc2626"
                    : "#000",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: uploading ? "not-allowed" : "pointer",
                marginBottom: "12px",
              }}
            >
              {uploading
                ? "⏳ Uploading..."
                : isResubmit
                  ? "🔄 Upload new document"
                  : "📎 Select file to upload"}
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

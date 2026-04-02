import {
  reactExtension,
  useSettings,
  useCartLines,
  useApplyAttributeChange,
  useAttributes,
  BlockStack,
  Text,
  Banner,
  DropZone,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useCallback, useEffect } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <DocUploadBlock />
));

function DocUploadBlock() {
  const settings = useSettings();
  const cartLines = useCartLines();
  const applyAttributeChange = useApplyAttributeChange();
  const attributes = useAttributes();

  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [error, setError] = useState("");

  const uploadTitle =
    settings.upload_title || "Please upload your document to proceed";
  const helperText =
    settings.helper_text || "Your file is securely stored with your order.";

  useEffect(() => {
    const existing = attributes.find((a) => a.key === "_doc_uploaded");
    if (existing?.value === "true") {
      setUploaded(true);
      const fileName = attributes.find((a) => a.key === "_doc_file_name");
      if (fileName) setUploadedFileName(fileName.value);
    }
  }, [attributes]);

  const handleDrop = useCallback(
    async ({ files }) => {
      if (!files || files.length === 0) return;
      const file = files[0];

      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }

      setError("");
      setUploading(true);

      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const productIds = cartLines.map((line) => line.merchandise.product.id);

        const res = await fetch(
          "https://docverify-shopify.vercel.app/api/upload",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileData: base64,
              productIds,
            }),
          },
        );

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();

        await applyAttributeChange({
          key: "_doc_uploaded",
          type: "updateAttribute",
          value: "true",
        });
        await applyAttributeChange({
          key: "_doc_file_path",
          type: "updateAttribute",
          value: data.filePath ?? "",
        });
        await applyAttributeChange({
          key: "_doc_file_name",
          type: "updateAttribute",
          value: file.name,
        });

        setUploaded(true);
        setUploadedFileName(file.name);
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [applyAttributeChange, cartLines],
  );

  return (
    <BlockStack spacing="base">
      <Text size="medium" emphasis="bold">
        {uploadTitle}
      </Text>
      <Text size="small" appearance="subdued">
        {helperText}
      </Text>

      {uploaded ? (
        <Banner status="success">
          <Text emphasis="bold">Document uploaded: {uploadedFileName}</Text>
        </Banner>
      ) : (
        <BlockStack spacing="tight">
          <DropZone
            onDrop={handleDrop}
            accept={[
              "application/pdf",
              "image/jpeg",
              "image/png",
              "image/webp",
            ]}
            allowMultiple={false}
            disabled={uploading}
          >
            <Text>
              {uploading ? "Uploading..." : "Drop file here or click to upload"}
            </Text>
          </DropZone>
          {error && (
            <Banner status="critical">
              <Text>{error}</Text>
            </Banner>
          )}
        </BlockStack>
      )}
    </BlockStack>
  );
}

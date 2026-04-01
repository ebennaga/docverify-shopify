import {
  reactExtension,
  useSettings,
  useCartLines,
  useApplyAttributeChange,
  useAttributes,
  BlockStack,
  Text,
  Button,
  Banner,
  FileUpload,
  InlineStack,
  Spinner,
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
  const [hasRestrictedProduct, setHasRestrictedProduct] = useState(false);
  const [checking, setChecking] = useState(true);

  const uploadTitle =
    settings.upload_title || "Please upload your document to proceed";
  const helperText =
    settings.helper_text || "Your file is securely stored with your order.";
  const errorMessage =
    settings.error_message ||
    "This product requires a valid document to purchase.";
  const buttonLabel = settings.button_label || "Upload document";

  // Cek apakah sudah upload sebelumnya
  useEffect(() => {
    const existing = attributes.find((a) => a.key === "_doc_uploaded");
    if (existing?.value === "true") {
      setUploaded(true);
      const fileName = attributes.find((a) => a.key === "_doc_file_name");
      if (fileName) setUploadedFileName(fileName.value);
    }
  }, [attributes]);

  // Cek produk restricted
  useEffect(() => {
    async function checkProducts() {
      setChecking(true);
      try {
        const productIds = cartLines.map((line) => line.merchandise.product.id);

        const res = await fetch(
          "https://docverify-shopify.vercel.app/api/check-products",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds }),
          },
        );

        if (res.ok) {
          const data = await res.json();
          setHasRestrictedProduct(data.hasRestricted ?? false);
        }
      } catch {
        setHasRestrictedProduct(false);
      } finally {
        setChecking(false);
      }
    }

    if (cartLines.length > 0) {
      checkProducts();
    } else {
      setChecking(false);
    }
  }, [cartLines]);

  const handleUpload = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;
      const file = files[0];

      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }

      setError("");
      setUploading(true);

      try {
        // Convert ke base64
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
          value: data.filePath,
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

  if (checking) return <Spinner />;
  if (!hasRestrictedProduct) return null;

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
          <BlockStack spacing="tight">
            <Text emphasis="bold">Document uploaded successfully</Text>
            {uploadedFileName && (
              <Text size="small" appearance="subdued">
                {uploadedFileName}
              </Text>
            )}
          </BlockStack>
        </Banner>
      ) : (
        <BlockStack spacing="tight">
          {uploading ? (
            <InlineStack spacing="tight">
              <Spinner />
              <Text>Uploading...</Text>
            </InlineStack>
          ) : (
            <FileUpload
              label={buttonLabel}
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              allowMultiple={false}
              onUpload={handleUpload}
            />
          )}
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

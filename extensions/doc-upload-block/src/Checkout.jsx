import {
  reactExtension,
  useSettings,
  useApplyAttributeChange,
  useAttributes,
  useShop,
  useCartLines,
  useBuyerJourneyIntercept,
  BlockStack,
  Text,
  Button,
  Banner,
  TextField,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useCallback, useEffect } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <DocUploadBlock />
));

function DocUploadBlock() {
  const settings = useSettings();
  const applyAttributeChange = useApplyAttributeChange();
  const attributes = useAttributes();
  const { myshopifyDomain } = useShop();
  const cartLines = useCartLines();

  const [uploaded, setUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [docCode, setDocCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasRestricted, setHasRestricted] = useState(false);
  const [checking, setChecking] = useState(true);

  const uploadTitle =
    settings.upload_title || "Please upload your document to proceed";
  const helperText =
    settings.helper_text || "Your file is securely stored with your order.";
  const buttonLabel = settings.button_label || "Upload document";

  // Cek apakah sudah upload
  useEffect(() => {
    const existing = attributes.find((a) => a.key === "_doc_uploaded");
    if (existing?.value === "true") {
      setUploaded(true);
      const fileName = attributes.find((a) => a.key === "_doc_file_name");
      if (fileName) setUploadedFileName(fileName.value);
    }
  }, [attributes]);

  // Cek apakah ada produk restricted di cart
  useEffect(() => {
    async function checkProducts() {
      setChecking(true);
      try {
        const productIds = cartLines.map((line) => line.merchandise.product.id);

        if (productIds.length === 0) {
          setHasRestricted(false);
          setChecking(false);
          return;
        }

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
          setHasRestricted(data.hasRestricted ?? false);
        } else {
          setHasRestricted(false);
        }
      } catch {
        setHasRestricted(false);
      } finally {
        setChecking(false);
      }
    }

    checkProducts();
  }, [cartLines]);

  // Block checkout hanya kalau ada produk restricted dan belum upload
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (canBlockProgress && hasRestricted && !uploaded) {
      return {
        behavior: "block",
        reason: "Document upload required",
        errors: [
          {
            message: "Please upload your document before proceeding.",
            target: "$.cart",
          },
        ],
      };
    }
    return { behavior: "allow" };
  });

  // Kalau tidak ada produk restricted atau masih checking, jangan tampilkan
  if (checking || !hasRestricted) return null;

  const handleConfirm = async () => {
    if (!docCode.trim()) {
      setError("Please enter the confirmation code.");
      return;
    }
    setSaving(true);
    try {
      await applyAttributeChange({
        key: "_doc_uploaded",
        type: "updateAttribute",
        value: "true",
      });
      await applyAttributeChange({
        key: "_doc_file_path",
        type: "updateAttribute",
        value: docCode,
      });
      await applyAttributeChange({
        key: "_doc_file_name",
        type: "updateAttribute",
        value: docCode.split("/").pop(),
      });
      setUploaded(true);
      setUploadedFileName(docCode.split("/").pop());
      setError("");
    } catch (err) {
      setError("Failed to confirm. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
            <Text emphasis="bold">Document submitted!</Text>
            <Text size="small" appearance="subdued">
              {uploadedFileName}
            </Text>
          </BlockStack>
        </Banner>
      ) : (
        <BlockStack spacing="tight">
          <Button
            kind="secondary"
            to={`https://docverify-shopify.vercel.app/upload?shop=${myshopifyDomain}`}
            target="_blank"
          >
            {buttonLabel}
          </Button>
          <Text size="small" appearance="subdued">
            After uploading, paste the confirmation code below:
          </Text>
          <TextField
            label="Confirmation code"
            value={docCode}
            onChange={setDocCode}
            placeholder="Paste code here"
          />
          <Button
            kind="primary"
            onPress={handleConfirm}
            loading={saving}
            disabled={!docCode.trim()}
          >
            Confirm document
          </Button>
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

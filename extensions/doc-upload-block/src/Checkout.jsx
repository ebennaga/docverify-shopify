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
  TextField,
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

  const [uploaded, setUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uploadTitle =
    settings.upload_title || "Please upload your document to proceed";
  const helperText =
    settings.helper_text ||
    "Paste your document URL or upload via the link below.";

  useEffect(() => {
    const existing = attributes.find((a) => a.key === "_doc_uploaded");
    if (existing?.value === "true") {
      setUploaded(true);
      const fileName = attributes.find((a) => a.key === "_doc_file_name");
      if (fileName) setUploadedFileName(fileName.value);
    }
  }, [attributes]);

  const handleSaveUrl = useCallback(async () => {
    if (!docUrl.trim()) {
      setError("Please enter a document URL.");
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
        value: docUrl,
      });
      await applyAttributeChange({
        key: "_doc_file_name",
        type: "updateAttribute",
        value: docUrl,
      });

      setUploaded(true);
      setUploadedFileName(docUrl);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [docUrl, applyAttributeChange]);

  // Generate upload page URL
  const uploadPageUrl = `https://docverify-shopify.vercel.app/upload?callback=checkout`;

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
          <Text emphasis="bold">Document submitted successfully!</Text>
        </Banner>
      ) : (
        <BlockStack spacing="tight">
          <Button kind="secondary" to={uploadPageUrl} target="_blank">
            Upload document on secure page
          </Button>
          <Text size="small" appearance="subdued">
            After uploading, paste the confirmation code below:
          </Text>
          <TextField
            label="Confirmation code"
            value={docUrl}
            onChange={setDocUrl}
            placeholder="Paste code here after uploading"
          />
          <Button kind="primary" onPress={handleSaveUrl} loading={saving}>
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

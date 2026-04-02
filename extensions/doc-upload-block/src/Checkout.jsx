import {
  reactExtension,
  useSettings,
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
  const applyAttributeChange = useApplyAttributeChange();
  const attributes = useAttributes();

  const [uploaded, setUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [docCode, setDocCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uploadTitle =
    settings.upload_title || "Please upload your document to proceed";
  const helperText =
    settings.helper_text || "Your file is securely stored with your order.";
  const buttonLabel = settings.button_label || "Upload document";

  useEffect(() => {
    const existing = attributes.find((a) => a.key === "_doc_uploaded");
    if (existing?.value === "true") {
      setUploaded(true);
      const fileName = attributes.find((a) => a.key === "_doc_file_name");
      if (fileName) setUploadedFileName(fileName.value);
    }
  }, [attributes]);

  const handleConfirm = useCallback(async () => {
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
  }, [docCode, applyAttributeChange]);

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
            to={`https://docverify-shopify.vercel.app/upload?return=${encodeURIComponent(window.location.href)}`}
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

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
  const [confirming, setConfirming] = useState(false);

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

  // Cek confirmation code dari URL (setelah redirect balik dari upload page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docCode = params.get("doc_code");
    const docName = params.get("doc_name");

    if (docCode && !uploaded) {
      handleAutoConfirm(docCode, docName ?? docCode);
    }
  }, []);

  const handleAutoConfirm = useCallback(
    async (filePath, fileName) => {
      setConfirming(true);
      try {
        await applyAttributeChange({
          key: "_doc_uploaded",
          type: "updateAttribute",
          value: "true",
        });
        await applyAttributeChange({
          key: "_doc_file_path",
          type: "updateAttribute",
          value: filePath,
        });
        await applyAttributeChange({
          key: "_doc_file_name",
          type: "updateAttribute",
          value: fileName,
        });
        setUploaded(true);
        setUploadedFileName(fileName);
      } catch (err) {
        console.error("Auto confirm failed:", err);
      } finally {
        setConfirming(false);
      }
    },
    [applyAttributeChange],
  );

  const handleUploadPress = useCallback(() => {
    const currentUrl = window.location.href;
    const uploadUrl = `https://docverify-shopify.vercel.app/upload?return=${encodeURIComponent(currentUrl)}`;
    window.location.href = uploadUrl;
  }, []);

  if (confirming) {
    return (
      <BlockStack spacing="base">
        <Text>Confirming your document...</Text>
      </BlockStack>
    );
  }

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
              {uploadedFileName.split("/").pop()}
            </Text>
          </BlockStack>
        </Banner>
      ) : (
        <Button kind="secondary" onPress={handleUploadPress}>
          {buttonLabel}
        </Button>
      )}
    </BlockStack>
  );
}

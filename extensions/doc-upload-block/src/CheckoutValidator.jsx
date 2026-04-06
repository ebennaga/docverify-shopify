import {
  reactExtension,
  useAttributes,
  useBuyerJourneyIntercept,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension(
  "purchase.checkout.delivery-address.render-before",
  () => <CheckoutValidator />,
);

function CheckoutValidator() {
  const attributes = useAttributes();

  const uploaded =
    attributes.find((a) => a.key === "_doc_uploaded")?.value === "true";

  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (canBlockProgress && !uploaded) {
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

  return null;
}

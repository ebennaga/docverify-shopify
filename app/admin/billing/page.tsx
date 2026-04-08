import { Suspense } from "react";
import { BillingClient } from "./BillingClient";

export default function BillingPage() {
  return (
    <Suspense fallback={<div style={{ padding: "24px", color: "#6b7280" }}>Loading billing...</div>}>
      <BillingClient />
    </Suspense>
  );
}

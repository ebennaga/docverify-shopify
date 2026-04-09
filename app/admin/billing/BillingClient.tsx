"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Plan = "free" | "basic" | "pro";

const PLANS = [
  {
    key: "free",
    label: "Free",
    price: "$0",
    period: "forever",
    features: ["1 product rule", "Manual review", "Basic support"],
    color: "#6b7280",
    bg: "#f9fafb",
  },
  {
    key: "basic",
    label: "Basic",
    price: "$9",
    period: "per month",
    features: ["Up to 3 product rules", "7-day free trial", "Email support"],
    color: "#2563eb",
    bg: "#eff6ff",
    highlight: true,
  },
  {
    key: "pro",
    label: "Pro",
    price: "$15",
    period: "per month",
    features: ["Unlimited product rules", "7-day free trial", "Priority support"],
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
];

export function BillingClient() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop") ?? "";
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  const [currentPlan, setCurrentPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!shop) return;
    fetch(`/api/billing/current?shop=${shop}`)
      .then((r) => r.json())
      .then((d) => setCurrentPlan(d.plan ?? "free"))
      .finally(() => setLoading(false));
  }, [shop]);

  async function handleSubscribe(plan: string) {
    if (!shop) return;
    setSubscribing(plan);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, plan }),
      });
      const data = await res.json();
      if (data.error === "REAUTH_REQUIRED" && data.authUrl) {
        window.top!.location.href = data.authUrl;
        return;
      }
      if (data.confirmationUrl) {
        window.top!.location.href = data.confirmationUrl;
      } else {
        alert("Failed to start subscription. Please try again.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setSubscribing(null);
    }
  }

  async function handleCancel() {
    if (!shop || !confirm("Cancel subscription and downgrade to Free?")) return;
    setCancelling(true);
    try {
      await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop }),
      });
      setCurrentPlan("free");
    } catch {
      alert("Something went wrong.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
        Billing & Subscription
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "24px" }}>
        Manage your plan. Upgrade anytime, cancel anytime.
      </p>

      {/* Alert */}
      {success && (
        <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#065f46" }}>
          ✅ Subscription activated successfully! You now have access to all features in your plan.
        </div>
      )}
      {error === "declined" && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#991b1b" }}>
          ❌ Subscription was declined. You remain on the Free plan.
        </div>
      )}

      {/* Current plan badge */}
      {!loading && (
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", color: "#6b7280" }}>Current plan:</span>
          <span style={{
            background: currentPlan === "pro" ? "#7c3aed" : currentPlan === "basic" ? "#2563eb" : "#6b7280",
            color: "white", fontSize: "13px", fontWeight: 700,
            padding: "3px 12px", borderRadius: "99px"
          }}>
            {currentPlan.toUpperCase()}
          </span>
          {currentPlan !== "free" && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{ fontSize: "13px", color: "#dc2626", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              {cancelling ? "Cancelling..." : "Cancel subscription"}
            </button>
          )}
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.key;
          const isUpgrade =
            (currentPlan === "free" && plan.key !== "free") ||
            (currentPlan === "basic" && plan.key === "pro");

          return (
            <div
              key={plan.key}
              style={{
                border: isActive ? `2px solid ${plan.color}` : "2px solid #e5e7eb",
                borderRadius: "12px",
                padding: "24px",
                background: isActive ? plan.bg : "white",
                position: "relative",
              }}
            >
              {plan.highlight && !isActive && (
                <div style={{
                  position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                  background: "#2563eb", color: "white", fontSize: "11px", fontWeight: 700,
                  padding: "3px 12px", borderRadius: "99px"
                }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ fontSize: "16px", fontWeight: 700, color: plan.color, marginBottom: "4px" }}>
                {plan.label}
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "2px" }}>
                {plan.price}
              </div>
              <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px" }}>
                {plan.period}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: "14px", color: "#374151", display: "flex", gap: "8px" }}>
                    <span style={{ color: plan.color }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {isActive ? (
                <div style={{
                  textAlign: "center", padding: "10px", borderRadius: "8px",
                  background: plan.color, color: "white", fontSize: "14px", fontWeight: 600
                }}>
                  Current Plan
                </div>
              ) : isUpgrade ? (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={subscribing === plan.key}
                  style={{
                    width: "100%", padding: "10px", borderRadius: "8px",
                    background: plan.color, color: "white", border: "none",
                    fontSize: "14px", fontWeight: 600, cursor: "pointer"
                  }}
                >
                  {subscribing === plan.key ? "Redirecting..." : `Upgrade to ${plan.label}`}
                </button>
              ) : (
                <div style={{
                  textAlign: "center", padding: "10px", borderRadius: "8px",
                  background: "#f3f4f6", color: "#9ca3af", fontSize: "14px"
                }}>
                  {plan.key === "free" ? "Default plan" : "Current or lower"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

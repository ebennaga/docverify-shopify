import { db } from "@/lib/supabase";

export type Plan = "free" | "basic" | "pro";

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 1,
  basic: 3,
  pro: Infinity,
};

export const PLAN_PRICES: Record<string, { price: string; label: string }> = {
  basic: { price: "9.00", label: "Basic" },
  pro: { price: "15.00", label: "Pro" },
};

export async function getCurrentPlan(shop: string): Promise<Plan> {
  const { data } = await db
    .from("subscriptions")
    .select("plan, status")
    .eq("shop", shop)
    .single();

  if (!data || data.status !== "active") return "free";
  return data.plan as Plan;
}

export async function canAddProductRule(
  shop: string,
  currentCount: number,
): Promise<boolean> {
  const plan = await getCurrentPlan(shop);
  return currentCount < PLAN_LIMITS[plan];
}

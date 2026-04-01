import { db } from "@/lib/supabase";
import ProductRulesClient from "./ProductRulesClient";

export default async function ProductsPage() {
  const { data: rules, error } = await db
    .from("product_rules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching rules:", error);
    return <div>Error loading product rules</div>;
  }

  return <ProductRulesClient rules={rules ?? []} />;
}

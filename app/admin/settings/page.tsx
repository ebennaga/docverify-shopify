import { db } from "@/lib/supabase";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const { shop } = await searchParams;

  const { data: settings } = await db
    .from("shop_settings")
    .select("*")
    .eq("shop", shop ?? "")
    .single();

  return <SettingsClient settings={settings} shop={shop ?? ""} />;
}

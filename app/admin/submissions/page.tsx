import { db } from "@/lib/supabase";
import SubmissionsClient from "./SubmissionsClient";

export default async function SubmissionsPage() {
  const { data: submissions } = await db
    .from("doc_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  return <SubmissionsClient submissions={submissions ?? []} />;
}

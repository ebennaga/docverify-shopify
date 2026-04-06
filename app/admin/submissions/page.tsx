import { db } from "@/lib/supabase";
import SubmissionsClient from "./SubmissionsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SubmissionsPage() {
  const { data: submissions, error } = await db
    .from("doc_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("Submissions:", submissions?.length, error);

  return <SubmissionsClient submissions={submissions ?? []} />;
}

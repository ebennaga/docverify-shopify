import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; host?: string }>;
}) {
  const params = await searchParams;
  const shop = params.shop;
  const host = params.host;

  if (shop) {
    redirect(`/admin?shop=${shop}&host=${host ?? ""}`);
  }

  redirect("/admin");
}

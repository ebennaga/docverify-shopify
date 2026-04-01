import { redirect } from "next/navigation";

export default function Home({
  searchParams,
}: {
  searchParams: { shop?: string; host?: string };
}) {
  const shop = searchParams.shop;
  const host = searchParams.host;

  if (shop) {
    redirect(`/admin?shop=${shop}&host=${host ?? ""}`);
  }

  redirect("/admin");
}

import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    shop?: string;
    host?: string;
    hmac?: string;
    timestamp?: string;
  }>;
}) {
  const params = await searchParams;
  const { shop, host, hmac, timestamp } = params;

  // Shopify load app dengan parameter ini
  if (shop && hmac) {
    redirect(`/admin?shop=${shop}&host=${host ?? ""}`);
  }

  if (shop) {
    redirect(`/api/auth?shop=${shop}&host=${host ?? ""}`);
  }

  redirect("/admin");
}

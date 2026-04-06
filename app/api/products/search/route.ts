import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  const query = req.nextUrl.searchParams.get("q") ?? "";

  if (!shop)
    return NextResponse.json({ error: "shop required" }, { status: 400 });

  const { data: session } = await db
    .from("Session")
    .select("access_token")
    .eq("shop", shop)
    .single();

  if (!session?.access_token)
    return NextResponse.json({ error: "No session" }, { status: 401 });

  const res = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.access_token,
    },
    body: JSON.stringify({
      query: `
          query SearchProducts($query: String!) {
            products(first: 10, query: $query) {
              edges {
                node {
                  id
                  title
                  featuredImage { url }
                }
              }
            }
          }
        `,
      variables: { query },
    }),
  });

  const data = await res.json();
  const products =
    data?.data?.products?.edges?.map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      image: e.node.featuredImage?.url ?? null,
    })) ?? [];

  return NextResponse.json(products);
}

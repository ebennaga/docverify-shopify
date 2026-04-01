"use client";

import {
  Page,
  Layout,
  Card,
  Text,
  DataTable,
  Badge,
  BlockStack,
  InlineGrid,
  Box,
} from "@shopify/polaris";

type Submission = {
  id: string;
  orderName: string | null;
  productId: string;
  customerEmail: string | null;
  status: string;
  createdAt: Date;
};

type Props = {
  stats: { total: number; pending: number; rejected: number };
  recent: Submission[];
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "critical"> = {
    VERIFIED: "success",
    PENDING: "warning",
    REJECTED: "critical",
  };

  return <Badge tone={map[status] || "warning"}>{status}</Badge>;
}

export default function DashboardClient({ stats, recent }: Props) {
  const rows = recent.map((s) => [
    s.orderName ?? "-", // ✅ no orderId error
    s.customerEmail ?? "-",
    <StatusBadge key={s.id} status={s.status} />,
    new Date(s.createdAt).toLocaleString(), // ✅ lebih bagus dari date saja
  ]);

  return (
    <Page title="DocVerify Dashboard">
      <Layout>
        {/* Stats */}
        <Layout.Section>
          <InlineGrid columns={3} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingLg" as="h2">
                  {stats.total}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Total verified orders
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingLg" as="h2">
                  {stats.pending}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Pending review
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingLg" as="h2">
                  {stats.rejected}
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Rejected documents
                </Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Recent submissions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">
                Recent document submissions
              </Text>

              {rows.length === 0 ? (
                <Box padding="400">
                  <Text as="p" tone="subdued">
                    No submissions yet
                  </Text>
                </Box>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text", "text"]}
                  headings={["Order", "Customer", "Status", "Date"]}
                  rows={rows}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

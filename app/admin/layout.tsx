"use client";

import { AppProvider } from "@shopify/polaris";
import { useEffect, useState } from "react";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider i18n={enTranslations}>
      <div style={{ minHeight: "100vh" }}>{children}</div>
    </AppProvider>
  );
}

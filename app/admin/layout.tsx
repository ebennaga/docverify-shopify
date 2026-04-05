"use client";

import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Product Rules", href: "/admin/products" },
    { label: "Submissions", href: "/admin/submissions" },
  ];

  return (
    <AppProvider i18n={enTranslations}>
      <div style={{ minHeight: "100vh", fontFamily: "sans-serif" }}>
        <nav
          style={{
            borderBottom: "1px solid #e5e7eb",
            padding: "0 20px",
            display: "flex",
            gap: "4px",
            background: "white",
          }}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                style={{
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#000" : "#6b7280",
                  textDecoration: "none",
                  borderBottom: active
                    ? "2px solid #000"
                    : "2px solid transparent",
                  display: "inline-block",
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </AppProvider>
  );
}

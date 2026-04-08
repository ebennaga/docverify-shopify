"use client";
import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";

function NavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop") ?? "";
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPending = useCallback(async () => {
    if (!shop) return;
    try {
      const res = await fetch(`/api/submissions/pending-count?shop=${shop}`);
      if (!res.ok) return;
      const data = await res.json();
      setPendingCount(data.count ?? 0);
    } catch {
      // silent fail
    }
  }, [shop]);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 30_000); // poll tiap 30 detik
    return () => clearInterval(interval);
  }, [fetchPending]);

  const navItems = [
    { label: "Dashboard", href: "/admin" },
    { label: "Product Rules", href: "/admin/products" },
    { label: "Submissions", href: "/admin/submissions", badge: pendingCount },
    { label: "Settings", href: "/admin/settings" },
  ];

  return (
    <nav
      style={{
        borderBottom: "1px solid #e5e7eb",
        padding: "0 20px",
        display: "flex",
        gap: "4px",
        background: "white",
        alignItems: "center",
      }}
    >
      {navItems.map((item) => {
        const active = pathname === item.href;
        const href = shop ? `${item.href}?shop=${shop}` : item.href;
        return (
          <a
            key={item.href}
            href={href}
            style={{
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: active ? 600 : 400,
              color: active ? "#000" : "#6b7280",
              textDecoration: "none",
              borderBottom: active ? "2px solid #000" : "2px solid transparent",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <span
                style={{
                  background: "#dc2626",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "99px",
                  lineHeight: "18px",
                  minWidth: "20px",
                  textAlign: "center",
                }}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider i18n={enTranslations}>
      <div style={{ minHeight: "100vh", fontFamily: "sans-serif" }}>
        <Suspense
          fallback={
            <nav
              style={{ borderBottom: "1px solid #e5e7eb", height: "45px" }}
            />
          }
        >
          <NavBar />
        </Suspense>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </AppProvider>
  );
}

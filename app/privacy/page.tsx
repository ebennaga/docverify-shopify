export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px", fontFamily: "sans-serif", color: "#111", lineHeight: "1.7" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>Privacy Policy</h1>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "40px" }}>Last updated: April 9, 2026</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>1. Introduction</h2>
      <p>DocVerify ("we", "our", or "us") is a Shopify app that enables merchants to require document verification before customers can purchase certain products. This Privacy Policy explains how we collect, use, and protect information when you use our app.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>2. Information We Collect</h2>
      <p><strong>From merchants:</strong></p>
      <ul>
        <li>Shopify store name and domain</li>
        <li>Access tokens for Shopify API integration</li>
        <li>Product rules and configuration settings</li>
        <li>Subscription and billing information (processed by Shopify)</li>
      </ul>
      <p><strong>From customers:</strong></p>
      <ul>
        <li>Uploaded documents (prescription, age certificate, confirmation letter, etc.)</li>
        <li>Name and email address submitted with document uploads</li>
        <li>Submission status and review history</li>
      </ul>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>3. How We Use Your Information</h2>
      <ul>
        <li>To verify customer eligibility to purchase restricted products</li>
        <li>To notify merchants of new document submissions</li>
        <li>To maintain submission history and audit trails</li>
        <li>To process subscription billing via Shopify Billing API</li>
        <li>To improve app functionality and performance</li>
      </ul>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>4. Data Storage</h2>
      <p>All data is stored securely on Supabase (PostgreSQL database hosted on AWS). Uploaded documents are stored in Supabase Storage. We retain customer submission data as long as the merchant's account is active. Merchants can delete submissions at any time from the app dashboard.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>5. Data Sharing</h2>
      <p>We do not sell, trade, or share your data with third parties except:</p>
      <ul>
        <li><strong>Supabase</strong> — database and file storage provider</li>
        <li><strong>Vercel</strong> — hosting and deployment provider</li>
        <li><strong>Shopify</strong> — platform provider for billing and store integration</li>
        <li><strong>Resend</strong> — email delivery service for notifications</li>
      </ul>
      <p>All third-party providers are bound by their own privacy policies and data processing agreements.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>6. Data Security</h2>
      <p>We implement industry-standard security measures including encrypted data transmission (HTTPS), secure token storage, and access controls. Uploaded documents are stored in private, access-controlled storage buckets.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>7. Customer Rights (GDPR)</h2>
      <p>If you are located in the European Economic Area, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction or deletion of your data</li>
        <li>Object to or restrict processing of your data</li>
        <li>Data portability</li>
      </ul>
      <p>To exercise these rights, contact us at <a href="mailto:freddy.eben@gmail.com" style={{ color: "#2563eb" }}>freddy.eben@gmail.com</a>.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>8. Data Retention</h2>
      <p>We retain merchant data for as long as the app is installed. Upon uninstallation, merchant data is deleted within 30 days. Customer submission data is retained according to the merchant's configuration.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>9. Children's Privacy</h2>
      <p>DocVerify is not intended for use by children under 13. We do not knowingly collect personal information from children.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>10. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify merchants of significant changes via email or in-app notification. Continued use of the app after changes constitutes acceptance of the updated policy.</p>

      <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: "32px" }}>11. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us:</p>
      <ul>
        <li>Email: <a href="mailto:freddy.eben@gmail.com" style={{ color: "#2563eb" }}>freddy.eben@gmail.com</a></li>
        <li>Website: <a href="https://docverify-shopify.vercel.app" style={{ color: "#2563eb" }}>https://docverify-shopify.vercel.app</a></li>
      </ul>

      <hr style={{ margin: "40px 0", borderColor: "#e5e7eb" }} />
      <p style={{ fontSize: "13px", color: "#9ca3af" }}>DocVerify is an independent app and is not affiliated with Shopify Inc.</p>
    </div>
  );
}

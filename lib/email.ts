import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSubmissionNotification({
  merchantEmail,
  orderName,
  customerEmail,
  fileName,
  submissionId,
  shop,
}: {
  merchantEmail: string;
  orderName: string;
  customerEmail: string;
  fileName: string;
  submissionId: string;
  shop: string;
}) {
  const reviewUrl = `https://docverify-shopify.vercel.app/admin/submissions`;

  await resend.emails.send({
    from: "DocVerify <onboarding@resend.dev>",
    to: merchantEmail,
    subject: `📄 New document submitted — ${orderName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111; margin-bottom: 4px;">New Document Submitted</h2>
        <p style="color: #6b7280; margin-top: 0;">A customer has uploaded a document for review.</p>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 140px;">Order</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${orderName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Customer</td>
              <td style="padding: 6px 0; font-size: 14px;">${customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">File</td>
              <td style="padding: 6px 0; font-size: 14px;">${fileName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Store</td>
              <td style="padding: 6px 0; font-size: 14px;">${shop}</td>
            </tr>
          </table>
        </div>

        <a href="${reviewUrl}" 
           style="display: inline-block; background: #000; color: white; padding: 12px 24px; 
                  border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Review Document →
        </a>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          This email was sent by DocVerify for ${shop}
        </p>
      </div>
    `,
  });
}

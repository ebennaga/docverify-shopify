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
        <a href="${reviewUrl}" style="display: inline-block; background: #000; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Review Document →
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          This email was sent by DocVerify for ${shop}
        </p>
      </div>
    `,
  });
}

// ✅ Email ke customer saat dokumen diverifikasi
export async function sendVerifiedEmail({
  customerEmail,
  orderName,
  fileName,
  reviewerNote,
  shop,
}: {
  customerEmail: string;
  orderName: string;
  fileName: string;
  reviewerNote?: string;
  shop: string;
}) {
  await resend.emails.send({
    from: "DocVerify <onboarding@resend.dev>",
    to: customerEmail,
    subject: `✅ Your document has been verified — ${orderName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #dcfce7; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">✅</span>
          <div>
            <h2 style="margin: 0; color: #15803d; font-size: 18px;">Document Verified</h2>
            <p style="margin: 4px 0 0; color: #16a34a; font-size: 14px;">Your document has been approved.</p>
          </div>
        </div>

        <p style="color: #374151; font-size: 15px;">
          Hi! Your document for order <strong>${orderName}</strong> has been reviewed and verified. Your order will now be processed.
        </p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 120px;">Order</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${orderName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Document</td>
              <td style="padding: 6px 0; font-size: 14px;">${fileName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Status</td>
              <td style="padding: 6px 0; font-size: 14px; color: #16a34a; font-weight: 600;">Verified ✓</td>
            </tr>
          </table>
        </div>

        ${
          reviewerNote
            ? `
        <div style="border-left: 3px solid #16a34a; padding: 10px 16px; background: #f0fdf4; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Note from reviewer:</strong> ${reviewerNote}</p>
        </div>
        `
            : ""
        }

        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          This email was sent by ${shop} via DocVerify.
        </p>
      </div>
    `,
  });
}

// ✅ Email ke customer saat dokumen ditolak
export async function sendRejectedEmail({
  customerEmail,
  orderName,
  fileName,
  reviewerNote,
  shop,
}: {
  customerEmail: string;
  orderName: string;
  fileName: string;
  reviewerNote?: string;
  shop: string;
}) {
  await resend.emails.send({
    from: "DocVerify <onboarding@resend.dev>",
    to: customerEmail,
    subject: `❌ Document rejected — action required for ${orderName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #fee2e2; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #b91c1c; font-size: 18px;">❌ Document Not Accepted</h2>
          <p style="margin: 4px 0 0; color: #dc2626; font-size: 14px;">Your document could not be verified.</p>
        </div>

        <p style="color: #374151; font-size: 15px;">
          Unfortunately, the document you submitted for order <strong>${orderName}</strong> was not accepted. Please upload a new document to proceed with your order.
        </p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px; width: 120px;">Order</td>
              <td style="padding: 6px 0; font-size: 14px; font-weight: 600;">${orderName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Document</td>
              <td style="padding: 6px 0; font-size: 14px;">${fileName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Status</td>
              <td style="padding: 6px 0; font-size: 14px; color: #b91c1c; font-weight: 600;">Rejected ✗</td>
            </tr>
          </table>
        </div>

        ${
          reviewerNote
            ? `
        <div style="border-left: 3px solid #ef4444; padding: 10px 16px; background: #fff1f2; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Reason:</strong> ${reviewerNote}</p>
        </div>
        `
            : ""
        }

        <p style="color: #374151; font-size: 14px;">
          Please contact the store if you have any questions.
        </p>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          This email was sent by ${shop} via DocVerify.
        </p>
      </div>
    `,
  });
}

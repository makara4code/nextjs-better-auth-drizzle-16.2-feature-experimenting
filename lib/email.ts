import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type EmailTemplateInput = {
  preview?: string;
  eyebrow?: string;
  title: string;
  description: string;
  bodyHtml: string;
  footer?: string;
};

type OtpEmailInput = {
  appName: string;
  actionLabel: string;
  otp: string;
};

declare global {
  var __mailTransporter: nodemailer.Transporter | undefined;
}

function parseSmtpSecure(value: string | undefined) {
  return value === "true";
}

function getMailTransporter() {
  globalThis.__mailTransporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? "1025"),
    secure: parseSmtpSecure(process.env.SMTP_SECURE),
    ...(process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        }
      : {}),
  });

  return globalThis.__mailTransporter;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderEmailTemplate({
  preview,
  eyebrow,
  title,
  description,
  bodyHtml,
  footer = "This message was sent automatically. If you did not request it, you can ignore it.",
}: EmailTemplateInput) {
  const safePreview = preview ? escapeHtml(preview) : "";
  const safeEyebrow = eyebrow ? escapeHtml(eyebrow) : "";
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeFooter = escapeHtml(footer);

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle}</title>
      </head>
      <body style="margin: 0; width: 100%; background-color: #fafafa; color: #09090b; font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        ${
          safePreview
            ? `<div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${safePreview}</div>`
            : ""
        }
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="width: 100%; min-width: 100%; background-color: #fafafa;">
          <tr>
            <td align="center" style="padding: 24px 12px;">
              <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="width: 100%; max-width: 560px; margin: 0 auto;">
                <tr>
                  <td style="padding-bottom: 12px; text-align: left; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #71717a;">
                    ${safeEyebrow || "Next 16 Starter"}
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #e4e4e7; border-radius: 18px; background-color: #ffffff; padding: 28px 20px; box-shadow: 0 1px 2px rgba(9, 9, 11, 0.04);">
                    <h1 style="margin: 0 0 12px; font-size: 28px; line-height: 1.1; font-weight: 600; color: #09090b; word-break: break-word;">
                      ${safeTitle}
                    </h1>
                    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #52525b; word-break: break-word;">
                      ${safeDescription}
                    </p>
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 8px 0; font-size: 13px; line-height: 1.6; color: #71717a;">
                    ${safeFooter}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function renderOtpEmail({
  appName,
  actionLabel,
  otp,
}: OtpEmailInput) {
  const safeOtp = escapeHtml(otp);

  return {
    text: [
      `${appName}`,
      "",
      `Use this verification code to ${actionLabel}:`,
      otp,
      "",
      "This code expires soon. If you did not request it, you can ignore this email.",
    ].join("\n"),
    html: renderEmailTemplate({
      preview: `Your verification code is ${otp}`,
      eyebrow: appName,
      title: "Verification code",
      description: `Use the code below to ${actionLabel}.`,
      bodyHtml: `
        <div style="border: 1px solid #e4e4e7; border-radius: 14px; background-color: #fafafa; padding: 20px 16px; text-align: center;">
          <div style="margin: 0 0 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #71717a;">
            One-time code
          </div>
          <div style="font-size: 32px; line-height: 1.1; font-weight: 700; letter-spacing: 0.18em; color: #09090b; word-break: break-word; overflow-wrap: anywhere;">
            ${safeOtp}
          </div>
        </div>
        <div style="margin-top: 18px; font-size: 14px; line-height: 1.7; color: #52525b;">
          For security, request a new code if this one expires.
        </div>
      `,
    }),
  };
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailInput) {
  const transporter = getMailTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "no-reply@local.test",
    to,
    subject,
    text,
    html,
  });
}

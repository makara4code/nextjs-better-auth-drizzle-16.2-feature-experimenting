import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
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

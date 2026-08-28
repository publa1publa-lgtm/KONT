import "server-only";

import nodemailer from "nodemailer";

import { isZohoConfigured, sendZohoMail } from "./zoho";

const FROM_DEFAULT = "KONT <join@kontme.com>";
const NOTIFY_DEFAULT = "join@kontme.com";

export function demoNotifyAddress(): string {
  return process.env.DEMO_NOTIFY_EMAIL?.trim() || NOTIFY_DEFAULT;
}

export function mailFromAddress(): string {
  return process.env.SMTP_FROM?.trim() || process.env.ZOHO_FROM?.trim() || process.env.SMTP_USER?.trim() || FROM_DEFAULT;
}

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  if (!host || !user || !pass) return null;
  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: port === 465,
    auth: { user, pass },
  };
}

export function isMailConfigured(): boolean {
  return isZohoConfigured() || smtpConfig() !== null;
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  if (isZohoConfigured()) {
    await sendZohoMail(input);
    return;
  }

  const smtp = smtpConfig();
  if (!smtp) {
    throw new Error("Mail is not configured.");
  }

  const transporter = nodemailer.createTransport(smtp);
  await transporter.sendMail({
    from: mailFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  });
}

import "server-only";

import { badRequest, json } from "@/lib/api/http";
import { isValidLocale, type AppLocale } from "@/i18n/config";
import { demoNotifyAddress, isMailConfigured, sendMail } from "@/lib/mail/send";
import { notifyDemoRequested } from "@/lib/ops/notify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UserCopy = {
  subject: string;
  text: string;
  html: string;
};

function userCopy(email: string, locale: AppLocale): UserCopy {
  if (locale === "ru") {
    return {
      subject: "Заявка на демо KONT получена",
      text: `Здравствуйте!\n\nМы получили вашу заявку на демо KONT (${email}).\nСкоро напишем с деталями раннего доступа.\n\n— команда KONT\njoin@kontme.com`,
      html: `<p>Здравствуйте!</p><p>Мы получили вашу заявку на демо KONT (<strong>${escapeHtml(email)}</strong>).</p><p>Скоро напишем с деталями раннего доступа.</p><p>— команда KONT<br/>join@kontme.com</p>`,
    };
  }
  if (locale === "he") {
    return {
      subject: "בקשת הדמו ל-KONT התקבלה",
      text: `שלום,\n\nקיבלנו את בקשת הדמו שלך ל-KONT (${email}).\nניצור קשר בקרוב עם פרטי גישה מוקדמת.\n\n— צוות KONT\njoin@kontme.com`,
      html: `<p dir="rtl">שלום,</p><p dir="rtl">קיבלנו את בקשת הדמו שלך ל-KONT (<strong>${escapeHtml(email)}</strong>).</p><p dir="rtl">ניצור קשר בקרוב עם פרטי גישה מוקדמת.</p><p dir="rtl">— צוות KONT<br/>join@kontme.com</p>`,
    };
  }
  return {
    subject: "We received your KONT demo request",
    text: `Hi,\n\nWe received your KONT demo request (${email}).\nWe'll be in touch shortly with early access details.\n\n— KONT\njoin@kontme.com`,
    html: `<p>Hi,</p><p>We received your KONT demo request (<strong>${escapeHtml(email)}</strong>).</p><p>We'll be in touch shortly with early access details.</p><p>— KONT<br/>join@kontme.com</p>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function postDemoRequest(req: Request) {
  if (!isMailConfigured()) {
    return json({ error: "Mail is not configured." }, 503);
  }

  const body = (await req.json().catch(() => null)) as { email?: unknown; locale?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return badRequest("Invalid email");
  }

  const locale: AppLocale = isValidLocale(body?.locale) ? body.locale : "en";
  const notifyTo = demoNotifyAddress();
  const copy = userCopy(email, locale);

  try {
    await sendMail({
      to: notifyTo,
      replyTo: email,
      subject: `New KONT demo request: ${email}`,
      text: `New demo request from ${email}\nLocale: ${locale}\nTime: ${new Date().toISOString()}`,
      html: `<p>New demo request from <strong>${escapeHtml(email)}</strong></p><p>Locale: ${locale}<br/>Time: ${escapeHtml(new Date().toISOString())}</p>`,
    });

    await sendMail({
      to: email,
      replyTo: notifyTo,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
    });
    await notifyDemoRequested({ email, locale });
  } catch (err) {
    console.error("[demo-request] mail failed", err);
    return json({ error: "Could not send email." }, 502);
  }

  return json({ ok: true });
}

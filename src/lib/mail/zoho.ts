import "server-only";

type ZohoDc = "com" | "eu" | "in" | "com.au" | "jp";

function zohoDc(): ZohoDc {
  const raw = (process.env.ZOHO_DC?.trim() || "com").toLowerCase();
  if (raw === "eu" || raw === "in" || raw === "com.au" || raw === "jp") return raw;
  return "com";
}

function accountsBase(): string {
  return `https://accounts.zoho.${zohoDc()}`;
}

function mailBase(): string {
  return `https://mail.zoho.${zohoDc()}`;
}

export function zohoFromAddress(): string {
  const raw = process.env.ZOHO_FROM?.trim() || process.env.SMTP_FROM?.trim() || "join@kontme.com";
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim();
}

export function isZohoConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_CLIENT_ID?.trim() &&
      process.env.ZOHO_CLIENT_SECRET?.trim() &&
      process.env.ZOHO_REFRESH_TOKEN?.trim(),
  );
}

async function zohoAccessToken(): Promise<string> {
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Zoho OAuth is not fully configured.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${accountsBase()}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as { access_token?: string; error?: string } | null;
  if (!res.ok || !json?.access_token) {
    throw new Error(json?.error || `Zoho token refresh failed (${res.status}).`);
  }
  return json.access_token;
}

async function zohoAccountId(accessToken: string): Promise<string> {
  const cached = process.env.ZOHO_ACCOUNT_ID?.trim();
  if (cached) return cached;

  const res = await fetch(`${mailBase()}/api/accounts`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as {
    data?: Array<{ accountId?: string | number }>;
    error?: { title?: string };
  } | null;
  const id = json?.data?.[0]?.accountId;
  if (!res.ok || id == null) {
    throw new Error(json?.error?.title || `Zoho account lookup failed (${res.status}).`);
  }
  return String(id);
}

export async function sendZohoMail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  const accessToken = await zohoAccessToken();
  const accountId = await zohoAccountId(accessToken);
  const fromAddress = zohoFromAddress();

  const payload: Record<string, unknown> = {
    fromAddress,
    toAddress: input.to,
    subject: input.subject,
    content: input.html || input.text,
    mailFormat: "html",
  };
  if (input.replyTo) payload.replyTo = input.replyTo;

  const res = await fetch(`${mailBase()}/api/accounts/${encodeURIComponent(accountId)}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Zoho send failed (${res.status}): ${errText.slice(0, 400)}`);
  }
}

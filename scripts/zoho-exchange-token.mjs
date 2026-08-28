/**
 * One-time: exchange a Zoho Self Client grant code for a refresh token.
 *
 * 1. Zoho API Console → Self Client
 * 2. Scope: ZohoMail.messages.CREATE,ZohoMail.accounts.READ
 * 3. Generate code (10 min)
 * 4. ZOHO_CLIENT_ID + ZOHO_CLIENT_SECRET in .env
 * 5. node scripts/zoho-exchange-token.mjs YOUR_CODE
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env");
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env may be missing in CI
  }
}

loadEnvLocal();

const code = process.argv[2]?.trim();
const clientId = process.env.ZOHO_CLIENT_ID?.trim();
const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
const dc = (process.env.ZOHO_DC?.trim() || "com").toLowerCase();

if (!code || !clientId || !clientSecret) {
  console.error("Usage: node scripts/zoho-exchange-token.mjs <GRANT_CODE>");
  console.error("Need ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in .env");
  process.exit(1);
}

const body = new URLSearchParams({
  grant_type: "authorization_code",
  client_id: clientId,
  client_secret: clientSecret,
  code,
});

const res = await fetch(`https://accounts.zoho.${dc}/oauth/v2/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body,
});

const json = await res.json();
if (!res.ok || !json.refresh_token) {
  console.error("Zoho token exchange failed:", json);
  process.exit(1);
}

console.log("Put this in .env and Vercel:");
console.log(`ZOHO_REFRESH_TOKEN=${json.refresh_token}`);

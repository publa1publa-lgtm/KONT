/**
 * Print chat / topic IDs for KONT ops Telegram.
 *
 * 1. Create a Group, enable Topics (Forum).
 * 2. Add the bot as admin (Post messages + Manage topics).
 * 3. Write one message in the group itself (not a private forward to the bot).
 * 4. npm run ops:telegram
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env");
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const token = process.env.KONTME_BOT_TG?.trim();
if (!token) {
  console.error("Missing KONTME_BOT_TG in .env");
  process.exit(1);
}

if (process.argv.includes("--ping")) {
  const chat = process.env.KONTME_TG_CHAT_ID?.split("#")[0].trim();
  const topic = Number((process.env.KONTME_TG_TOPIC_USERS ?? "").split("#")[0].trim());
  if (!chat) {
    console.error("Missing KONTME_TG_CHAT_ID");
    process.exit(1);
  }
  const body = {
    chat_id: chat,
    text: "KONT ops ping — Users topic is connected.",
    disable_web_page_preview: true,
    ...(Number.isFinite(topic) && topic > 0 ? { message_thread_id: topic } : {}),
  };
  const ping = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const pingData = await ping.json();
  if (!pingData?.ok) {
    console.error("Ping failed:", pingData?.description || ping.status);
    process.exit(1);
  }
  console.log("Ping sent to Users.");
  process.exit(0);
}

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=50`);
const data = await res.json();
if (!data?.ok) {
  console.error(data?.description || "getUpdates failed");
  process.exit(1);
}

const groups = new Map();
let privateOnly = 0;

for (const update of data.result ?? []) {
  const msg = update.message || update.channel_post || update.edited_message;
  if (!msg) continue;

  const source = msg.chat?.type === "private" ? msg.forward_from_chat || msg.forward_origin?.chat : msg.chat;
  if (!source?.id) {
    if (msg.chat?.type === "private") privateOnly += 1;
    continue;
  }
  if (source.type === "private") {
    privateOnly += 1;
    continue;
  }

  const key = String(source.id);
  const row = groups.get(key) ?? {
    id: source.id,
    title: source.title || source.username || key,
    type: source.type,
    forum: Boolean(source.is_forum),
    topics: new Map(),
  };
  const threadId = msg.message_thread_id;
  const topicName =
    msg.forum_topic_created?.name ||
    msg.reply_to_message?.forum_topic_created?.name ||
    (threadId ? `topic ${threadId}` : "General");
  if (threadId) row.topics.set(threadId, topicName);
  groups.set(key, row);
}

if (groups.size === 0) {
  console.log("No group/channel id yet.");
  if (privateOnly > 0) {
    console.log(
      "The bot only saw private chats. Forwarding a group message to the bot in DM does not include the group id.",
    );
  }
  console.log("Add the bot to the group as admin, send hi in that group, then run this again.");
  process.exit(0);
}

console.log("Put these into .env:\n");
for (const row of groups.values()) {
  console.log(`KONTME_TG_CHAT_ID=${row.id}`);
  console.log(`# ${row.title} (${row.type}${row.forum ? ", forum" : ""})`);
  if (row.topics.size === 0) {
    console.log("# No topics seen — enable Topics, then post once in each.");
  }
  for (const [id, name] of row.topics) {
    const env = /user/i.test(name)
      ? "KONTME_TG_TOPIC_USERS"
      : /demo/i.test(name)
        ? "KONTME_TG_TOPIC_DEMOS"
        : /platform/i.test(name)
          ? "KONTME_TG_TOPIC_PLATFORMS"
          : "KONTME_TG_TOPIC_GENERAL";
    console.log(`${env}=${id}   # ${name}`);
  }
  console.log("");
}

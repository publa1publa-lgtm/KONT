#!/usr/bin/env node
/**
 * Builds ru-flat.json and he-flat.json from en-flat.json + locale chunk files.
 * Run: node scripts/locale-data/gen-translations.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const enFlat = JSON.parse(readFileSync(join(__dirname, "en-flat.json"), "utf8"));

const KEEP = new Set([
  "story.brand",
  "story.footer.productLinks[0].href",
  "story.footer.productLinks[1].href",
  "story.footer.productLinks[2].href",
  "story.footer.resourceLinks[0].href",
  "story.footer.resourceLinks[1].href",
  "story.footer.companyLinks[0].href",
  "story.footer.companyLinks[1].href",
  "landing.hero.platforms[0]",
  "landing.hero.platforms[1]",
  "landing.hero.platforms[2]",
  "landing.hero.platforms[3]",
  "landing.hero.platforms[4]",
  "landing.hero.platforms[5]",
  "landing.hero.pulse.activities[0].icon",
  "landing.hero.pulse.activities[1].icon",
  "landing.hero.pulse.activities[2].icon",
  "landing.hero.pulse.insights[0].value",
  "landing.hero.pulse.insights[1].value",
  "landing.hero.pulse.insights[2].value",
  "landing.hero.pulse.metrics[0].value",
  "landing.hero.pulse.metrics[1].value",
  "landing.pillars.items[0].id",
  "landing.pillars.items[1].id",
  "landing.pillars.items[2].id",
  "landing.benefits.stats[0].suffix",
  "landing.benefits.stats[1].suffix",
  "landing.benefits.stats[2].suffix",
  "landing.benefits.stats[3].suffix",
  "landing.benefits.testimonial.author",
  "landing.bento.features[0].id",
  "landing.bento.features[1].id",
  "landing.bento.features[2].id",
  "studio.nav.linktree",
  "studio.linkStudio.profileEditor.usernameHint",
  "studio.linkStudio.profileEditor.connectInstagram",
  "studio.linkStudio.profileEditor.pageUrlPlaceholder",
  "studio.linkTreeStudio.label",
  "studio.linkTreeStudio.themes.light.title",
  "studio.linkTreeStudio.themes.paper.title",
  "studio.linkTreeStudio.themes.slate.title",
  "studio.linkTreeStudio.themes.sand.title",
  "studio.linkTreeStudio.themes.lavender.title",
  "studio.linkTreeStudio.themes.blush.title",
  "studio.linkTreeStudio.themes.arctic.title",
  "studio.linkTreeStudio.themes.dark.title",
  "studio.linkTreeStudio.themes.noir.title",
  "studio.linkTreeStudio.themes.midnight.title",
  "studio.linkTreeStudio.themes.cosmos.title",
  "studio.linkTreeStudio.themes.gold.title",
  "studio.linkTreeStudio.themes.obsidian.title",
  "studio.linkTreeStudio.themes.sunset.title",
  "studio.linkTreeStudio.themes.ember.title",
  "studio.linkTreeStudio.themes.candy.title",
  "studio.linkTreeStudio.themes.gradient.title",
  "studio.linkTreeStudio.themes.ocean.title",
  "studio.linkTreeStudio.themes.forest.title",
  "studio.linkTreeStudio.themes.aurora.title",
  "studio.linkTreeStudio.themes.coral.title",
  "studio.linkTreeStudio.themes.neon.title",
  "studio.linkTreeStudio.themes.retro.title",
  "studio.linkTreeStudio.themes.cyber.title",
  "studio.linkTreeStudio.themes.electric.title",
  "studio.user.sendEmailDevSkipped",
  "studio.content.composer.preview.brand",
  "studio.inbox.platform.instagram",
  "studio.inbox.platform.youtube",
  "studio.inbox.platform.tiktok",
  "studio.inbox.platform.facebook",
  "studio.inbox.platform.pinterest",
  "studio.inbox.platform.linkedin",
  "studio.inbox.platform.telegram",
  "studio.locale.en",
  "studio.locale.he",
  "studio.locale.ru",
  "studio.automations.json",
  "studio.preview.publicPath",
  "studio.account.supportEmail",
  "auth.register.brand",
  "auth.register.placeholders.firstName",
  "auth.register.placeholders.lastName",
  "auth.register.placeholders.login",
  "auth.register.placeholders.email",
  "demoModal.emailPlaceholder",
]);

function loadChunks(locale) {
  const dir = join(__dirname, "chunks", locale);
  const merged = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const chunk = JSON.parse(readFileSync(join(dir, file), "utf8"));
    Object.assign(merged, chunk);
  }
  return merged;
}

function buildFlat(locale) {
  const chunks = loadChunks(locale);
  const flat = {};
  const missing = [];

  for (const [path, value] of Object.entries(enFlat)) {
    if (KEEP.has(path)) {
      flat[path] = value;
      continue;
    }
    if (path in chunks) {
      flat[path] = chunks[path];
      continue;
    }
    missing.push(path);
  }

  if (missing.length) {
    console.error(`${locale}: missing ${missing.length} translations`);
    console.error(missing.slice(0, 20).join("\n"));
    process.exit(1);
  }

  return flat;
}

for (const locale of ["ru", "he"]) {
  const flat = buildFlat(locale);
  writeFileSync(join(__dirname, `${locale}-flat.json`), `${JSON.stringify(flat, null, 2)}\n`, "utf8");
  console.log(`Wrote ${locale}-flat.json (${Object.keys(flat).length} keys)`);
}

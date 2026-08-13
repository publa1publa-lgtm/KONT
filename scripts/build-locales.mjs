#!/usr/bin/env node
/**
 * Deep-clones en.json and applies path-keyed translations.
 * Run: node scripts/build-locales.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const ruFlat = JSON.parse(readFileSync(join(__dirname, "locale-data/ru-flat.json"), "utf8"));
const heFlat = JSON.parse(readFileSync(join(__dirname, "locale-data/he-flat.json"), "utf8"));
const en = JSON.parse(readFileSync(join(root, "src/messages/en.json"), "utf8"));

function collectPaths(o, p = "") {
  const paths = [];
  for (const [k, v] of Object.entries(o)) {
    const path = p ? `${p}.${k}` : k;
    if (typeof v === "string") paths.push(path);
    else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        const ip = `${path}[${i}]`;
        if (typeof item === "string") paths.push(ip);
        else paths.push(...collectPaths(item, ip));
      });
    } else if (v && typeof v === "object") paths.push(...collectPaths(v, path));
  }
  return paths;
}

function applyTranslations(source, flat, locale) {
  if (typeof source === "string") return source;
  if (typeof source === "number" || typeof source === "boolean" || source === null) {
    return source;
  }
  if (Array.isArray(source)) {
    return source.map((item, i) => {
      if (typeof item === "string") {
        const path = `${locale._path}[${i}]`;
        if (!(path in flat)) throw new Error(`Missing ${locale} translation: ${path}`);
        return flat[path];
      }
      if (typeof item === "number" || typeof item === "boolean" || item === null) {
        return item;
      }
      return applyTranslations(item, flat, { _path: `${locale._path}[${i}]` });
    });
  }
  const out = {};
  for (const [k, v] of Object.entries(source)) {
    const path = locale._path ? `${locale._path}.${k}` : k;
    if (typeof v === "string") {
      if (!(path in flat)) throw new Error(`Missing ${locale} translation: ${path}`);
      out[k] = flat[path];
    } else if (typeof v === "number" || typeof v === "boolean" || v === null) {
      out[k] = v;
    } else if (Array.isArray(v)) {
      out[k] = v.map((item, i) => {
        const ip = `${path}[${i}]`;
        if (typeof item === "string") {
          if (!(ip in flat)) throw new Error(`Missing translation: ${ip}`);
          return flat[ip];
        }
        if (typeof item === "number" || typeof item === "boolean" || item === null) {
          return item;
        }
        return applyTranslations(item, flat, { _path: ip });
      });
    } else if (v && typeof v === "object") {
      out[k] = applyTranslations(v, flat, { _path: path });
    }
  }
  return out;
}

const enPaths = collectPaths(en).sort();
for (const [name, flat] of [
  ["ru", ruFlat],
  ["he", heFlat],
]) {
  const flatPaths = Object.keys(flat).sort();
  const missing = enPaths.filter((p) => !(p in flat));
  const extra = flatPaths.filter((p) => !enPaths.includes(p));
  if (missing.length) {
    console.error(`${name} missing ${missing.length}:`, missing.slice(0, 10));
    process.exit(1);
  }
  if (extra.length) {
    console.error(`${name} extra ${extra.length}:`, extra.slice(0, 10));
    process.exit(1);
  }
}

const ru = applyTranslations(en, ruFlat, { _path: "" });
const he = applyTranslations(en, heFlat, { _path: "" });

writeFileSync(join(root, "src/messages/ru.json"), `${JSON.stringify(ru, null, 2)}\n`, "utf8");
writeFileSync(join(root, "src/messages/he.json"), `${JSON.stringify(he, null, 2)}\n`, "utf8");

function keys(o, p = "") {
  const k = [];
  for (const [a, v] of Object.entries(o)) {
    const path = p ? `${p}.${a}` : a;
    if (typeof v === "string") k.push(path);
    else if (Array.isArray(v))
      v.forEach((x, i) => {
        const ip = `${path}[${i}]`;
        if (typeof x === "string") k.push(ip);
        else k.push(...keys(x, ip));
      });
    else if (v && typeof v === "object") k.push(...keys(v, path));
  }
  return k;
}

const ek = keys(en).sort();
const rk = keys(ru).sort();
const hk = keys(he).sort();
console.log("ru match", JSON.stringify(ek) === JSON.stringify(rk), `(${rk.length} keys)`);
console.log("he match", JSON.stringify(ek) === JSON.stringify(hk), `(${hk.length} keys)`);

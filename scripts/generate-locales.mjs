#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ru } from "./locale-data/ru.mjs";
import { he } from "./locale-data/he.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const en = JSON.parse(readFileSync(join(root, "src/messages/en.json"), "utf8"));

function keys(o, p = "") {
  const k = [];
  for (const [a, v] of Object.entries(o)) {
    const path = p ? `${p}.${a}` : a;
    if (typeof v === "string") k.push(path);
    else if (Array.isArray(v))
      v.forEach((x, i) => k.push(...keys(x, `${path}[${i}]`)));
    else if (v && typeof v === "object") k.push(...keys(v, path));
  }
  return k;
}

function assertSameStructure(a, b, path = "") {
  if (typeof a !== typeof b) {
    throw new Error(`Type mismatch at ${path || "root"}: ${typeof a} vs ${typeof b}`);
  }
  if (typeof a === "string") return;
  if (Array.isArray(a)) {
    if (a.length !== b.length) throw new Error(`Array length mismatch at ${path}`);
    a.forEach((item, i) => assertSameStructure(item, b[i], `${path}[${i}]`));
    return;
  }
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (JSON.stringify(aKeys) !== JSON.stringify(bKeys)) {
    throw new Error(`Key mismatch at ${path}: ${aKeys.join(",")} vs ${bKeys.join(",")}`);
  }
  for (const key of aKeys) {
    assertSameStructure(a[key], b[key], path ? `${path}.${key}` : key);
  }
}

assertSameStructure(en, ru, "ru");
assertSameStructure(en, he, "he");

writeFileSync(join(root, "src/messages/ru.json"), `${JSON.stringify(ru, null, 2)}\n`, "utf8");
writeFileSync(join(root, "src/messages/he.json"), `${JSON.stringify(he, null, 2)}\n`, "utf8");

const ek = keys(en).sort();
const rk = keys(ru).sort();
const hk = keys(he).sort();
console.log("ru match", JSON.stringify(ek) === JSON.stringify(rk), `(${rk.length} keys)`);
console.log("he match", JSON.stringify(ek) === JSON.stringify(hk), `(${hk.length} keys)`);

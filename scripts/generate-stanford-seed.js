/**
 * Reads stanford_doctors.csv and generates SQL to replace providers with Stanford data.
 * Run: node scripts/generate-stanford-seed.js
 * Then run the generated SQL in Supabase SQL Editor.
 */

const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "..", "stanford_doctors.csv");
const outPath = path.join(__dirname, "..", "supabase", "seed_stanford_providers.sql");

function escapeSql(str) {
  if (str == null || str === "") return null;
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function parseCsvLine(line) {
  const parts = line.split(",");
  if (parts.length < 3) return null;
  const name = parts[0].trim();
  const specialty = parts[1].trim();
  const photoUrl = parts[2].trim();
  const address = parts.slice(3).join(",").trim() || "";
  return { name, specialty, photoUrl, address };
}

const csv = fs.readFileSync(csvPath, "utf-8");
const lines = csv.split(/\r?\n/).filter((l) => l.trim());
const header = lines[0];
const dataLines = lines.slice(1);

// Stanford area default (Palo Alto / Stanford Medical Center)
const DEFAULT_LNG = -122.17;
const DEFAULT_LAT = 37.44;

const rows = [];
for (const line of dataLines) {
  const r = parseCsvLine(line);
  if (!r || !r.name) continue;
  const role = r.specialty.slice(0, 100);
  const services = "ARRAY['nursing']";
  const specialties = "ARRAY[" + escapeSql(r.specialty.slice(0, 200)) + "]";
  const rating = "4.5";
  const visit_count = "100";
  const price = "150";
  const next_available = "NOW() + INTERVAL '1 day'";
  const photo_url = r.photoUrl ? escapeSql(r.photoUrl) : "NULL";
  const location = `ST_SetSRID(ST_MakePoint(${DEFAULT_LNG}, ${DEFAULT_LAT}), 4326)::geography`;
  rows.push(
    `  (${escapeSql(r.name)}, ${escapeSql(role)}, ${services}, ${specialties}, ${rating}, ${visit_count}, ${price}, ${next_available}, ${photo_url}, ${location})`
  );
}

const sql = `-- Stanford doctors seed: replace example providers with data from stanford_doctors.csv
-- Run this in Supabase SQL Editor after schema and migrations.
-- WARNING: This deletes all existing providers (and cascades to bookings referencing them).

DELETE FROM providers;

INSERT INTO providers (name, role, services, specialties, rating, visit_count, price, next_available, photo_url, location)
VALUES
${rows.join(",\n")};
`;

fs.writeFileSync(outPath, sql, "utf-8");
console.log("Generated", outPath, "with", rows.length, "providers.");
console.log("Run this file in Supabase Dashboard → SQL Editor to replace example data.");
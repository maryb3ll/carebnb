/**
 * Reads stanford_doctors2.csv and generates SQL to replace all providers with that data.
 * Run: node scripts/generate-stanford-seed.js
 * Then run the generated supabase/seed_stanford_providers.sql in Supabase SQL Editor.
 */

const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "..", "stanford_doctors2.csv");
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

// Stanford area center (Palo Alto / Stanford Medical Center)
const CENTER_LNG = -122.17;
const CENTER_LAT = 37.44;
// Spread providers in ~8 km radius so distance_km varies (degree ~111km; 0.01 deg ~1.1 km)
function offsetForIndex(i) {
  const angle = (i * 137.5) % 360;
  const radiusDeg = 0.01 + ((i % 50) / 50) * 0.06;
  const rad = (angle * Math.PI) / 180;
  return {
    lat: CENTER_LAT + radiusDeg * Math.cos(rad),
    lng: CENTER_LNG + radiusDeg * Math.sin(rad),
  };
}

const rows = [];
dataLines.forEach((line, i) => {
  const r = parseCsvLine(line);
  if (!r || !r.name) return;
  const role = r.specialty.slice(0, 100);
  const services = "ARRAY['nursing']";
  const specialties = "ARRAY[" + escapeSql(r.specialty.slice(0, 200)) + "]";
  const rating = "4.5";
  const visit_count = "100";
  const price = "150";
  const next_available = "NOW() + INTERVAL '1 day'";
  const photo_url = r.photoUrl ? escapeSql(r.photoUrl) : "NULL";
  const { lat, lng } = offsetForIndex(i);
  const location = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
  rows.push(
    `  (${escapeSql(r.name)}, ${escapeSql(role)}, ${services}, ${specialties}, ${rating}, ${visit_count}, ${price}, ${next_available}, ${photo_url}, ${location})`
  );
});

const sql = `-- Stanford doctors seed: replace ALL providers with data from stanford_doctors2.csv
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor).
-- WARNING: This deletes all existing providers (and cascades to bookings referencing them).

DELETE FROM providers;

INSERT INTO providers (name, role, services, specialties, rating, visit_count, price, next_available, photo_url, location)
VALUES
${rows.join(",\n")};
`;

fs.writeFileSync(outPath, sql, "utf-8");
console.log("Generated", outPath, "with", rows.length, "providers.");
console.log("Run supabase/seed_stanford_providers.sql in Supabase Dashboard → SQL Editor to replace all providers.");
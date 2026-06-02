#!/usr/bin/env node
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";

const args = parseArgs(process.argv.slice(2));
const input = args.in || "tmp/prod-d1-data.sql";
const outDir = args["out-dir"] || "tmp/prod-d1-data-chunks";
const maxBytes = Number(args["max-bytes"] || 4 * 1024 * 1024);

if (!Number.isFinite(maxBytes) || maxBytes < 100000) {
  usage("Invalid --max-bytes value.");
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

let chunkIndex = 0;
let chunkBytes = 0;
let chunkStream = null;
let statement = "";
let statementCount = 0;

const inputStream = createReadStream(resolve(input), { encoding: "utf8" });
const lines = createInterface({ input: inputStream, crlfDelay: Infinity });

for await (const line of lines) {
  statement += `${line}\n`;

  if (!line.endsWith(";")) {
    continue;
  }

  writeStatement(statement);
  statement = "";
  statementCount += 1;
}

if (statement.trim()) {
  writeStatement(statement);
  statementCount += 1;
}

if (chunkStream) {
  chunkStream.end();
  await onceFinished(chunkStream);
}

console.log(`Wrote ${chunkIndex} chunks and ${statementCount} statements to ${resolve(outDir)}`);

function writeStatement(sql) {
  const bytes = Buffer.byteLength(sql);
  if (!chunkStream || (chunkBytes > 0 && chunkBytes + bytes > maxBytes)) {
    rotateChunk();
  }

  chunkStream.write(sql);
  chunkBytes += bytes;
}

function rotateChunk() {
  if (chunkStream) {
    chunkStream.end();
  }

  chunkIndex += 1;
  chunkBytes = 0;
  const filename = join(outDir, `prod-d1-data-${String(chunkIndex).padStart(4, "0")}.sql`);
  chunkStream = createWriteStream(filename, { flags: "w" });
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function onceFinished(stream) {
  return new Promise((resolveFinished, rejectFinished) => {
    stream.on("finish", resolveFinished);
    stream.on("error", rejectFinished);
  });
}

function usage(message) {
  console.error(message);
  console.error("Usage: node scripts/split-d1-sql.mjs --in tmp/prod-d1-data.sql --out-dir tmp/prod-d1-data-chunks");
  process.exit(1);
}

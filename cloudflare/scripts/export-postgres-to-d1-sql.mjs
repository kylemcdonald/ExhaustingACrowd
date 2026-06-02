#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";

const BUCKET_MS = 5000;
const MAX_INSERT_BYTES = 20000;

class InsertWriter {
  constructor(stream) {
    this.stream = stream;
    this.statements = new Map();
  }

  add(table, columns, values) {
    const row = `(${values.join(", ")})`;
    const key = `${table}:${columns.join(",")}`;
    const prefix = `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n`;
    let statement = this.statements.get(key);

    if (!statement) {
      statement = {
        sql: prefix,
        rows: []
      };
      this.statements.set(key, statement);
    }

    if (statement.sql.length + row.length + 3 > MAX_INSERT_BYTES) {
      this.flush(key);
      statement = {
        sql: prefix,
        rows: []
      };
      this.statements.set(key, statement);
    }

    statement.rows.push(row);
    statement.sql += `${statement.rows.length === 1 ? "" : ",\n"}${row}`;
  }

  flush(key) {
    const statement = this.statements.get(key);
    if (!statement) {
      return;
    }

    this.stream.write(`${statement.sql};\n`);
    this.statements.delete(key);
  }

  flushAll() {
    for (const key of Array.from(this.statements.keys())) {
      this.flush(key);
    }
  }
}

const args = parseArgs(process.argv.slice(2));
const sshHost = args.ssh;
const outPath = args.out || "tmp/prod-d1-data.sql";
const database = args.database || "exhausting";

if (!sshHost) {
  usage("Missing required --ssh user@host argument.");
}

const outputFile = resolve(outPath);
await mkdir(dirname(outputFile), { recursive: true });

const out = createWriteStream(outputFile, { flags: "w" });
out.write("-- Generated from PostgreSQL for Cloudflare D1. Do not commit production data.\n");
out.write("DELETE FROM note_buckets;\n");
out.write("DELETE FROM notes;\n");
out.write("DELETE FROM blacklist;\n");
out.write("DELETE FROM stats5min;\n");
out.write("DELETE FROM stats60min;\n");

await exportTable("notes", notesQuery(database), (row, writer) => writeNote(row, writer));
await exportTable("blacklist", blacklistQuery(database), (row, writer) => {
  writer.add("blacklist", ["ip"], [sqlString(normalizeIp(row.ip))]);
});
await exportTable("stats5min", statsQuery(database, "stats5min"), (row, writer) => {
  writer.add("stats5min", ["chunk", "time_begin", "time_end", "count"], [
    sqlNumber(row.chunk),
    sqlNumber(row.time_begin),
    sqlNumber(row.time_end),
    sqlNumber(row.count)
  ]);
});
await exportTable("stats60min", statsQuery(database, "stats60min"), (row, writer) => {
  writer.add("stats60min", ["chunk", "time_begin", "time_end", "count"], [
    sqlNumber(row.chunk),
    sqlNumber(row.time_begin),
    sqlNumber(row.time_end),
    sqlNumber(row.count)
  ]);
});

out.end();
await onceFinished(out);
console.log(`Wrote ${outputFile}`);

async function exportTable(name, sql, writeRow) {
  console.error(`Exporting ${name}...`);
  const writer = new InsertWriter(out);
  const child = spawn("ssh", [
    "-o", "BatchMode=yes",
    sshHost,
    `sudo -u postgres psql -d ${shellQuote(database)} -At -c ${shellQuote(sql)}`
  ], {
    stdio: ["ignore", "pipe", "inherit"]
  });

  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
  let count = 0;
  for await (const line of lines) {
    if (!line) {
      continue;
    }
    writeRow(JSON.parse(line), writer);
    count += 1;
  }

  const code = await onceExit(child);
  if (code !== 0) {
    throw new Error(`Export for ${name} failed with exit code ${code}`);
  }

  writer.flushAll();
  console.error(`Exported ${count} ${name} rows.`);
}

function writeNote(row, writer) {
  const pathJson = JSON.stringify(row.path || []);
  const normalizedIp = normalizeIp(row.ip);
  const hidden = row.hidden === null || row.hidden === undefined ? "NULL" : row.hidden ? "1" : "0";

  writer.add("notes", [
    "id",
    "time_begin",
    "time_end",
    "note",
    "ip",
    "timestamp",
    "path_json",
    "hidden",
    "site"
  ], [
    sqlNumber(row.id),
    sqlNumber(row.time_begin),
    sqlNumber(row.time_end),
    sqlString(row.note),
    sqlString(normalizedIp),
    sqlString(row.timestamp),
    sqlString(pathJson),
    hidden,
    sqlNumber(row.site)
  ]);

  for (const bucket of bucketsForRange(row.time_begin, row.time_end)) {
    writer.add("note_buckets", ["site", "bucket", "note_id"], [
      sqlNumber(row.site),
      sqlNumber(bucket),
      sqlNumber(row.id)
    ]);
  }
}

function notesQuery(database) {
  return copyJsonQuery(`
    SELECT json_build_object(
      'id', id,
      'time_begin', time_begin,
      'time_end', time_end,
      'note', note,
      'ip', ip::text,
      'timestamp', to_char(timestamp, 'YYYY-MM-DD HH24:MI:SS.MS'),
      'path', array_to_json(path),
      'hidden', hidden,
      'site', site
    )::text
    FROM notes
    ORDER BY id
  `);
}

function blacklistQuery() {
  return copyJsonQuery(`
    SELECT json_build_object('ip', ip::text)::text
    FROM blacklist
    ORDER BY ip::text
  `);
}

function statsQuery(_database, table) {
  return copyJsonQuery(`
    SELECT json_build_object(
      'chunk', chunk,
      'time_begin', time_begin,
      'time_end', time_end,
      'count', count
    )::text
    FROM ${table}
    ORDER BY chunk
  `);
}

function copyJsonQuery(query) {
  return query;
}

function bucketsForRange(timeBegin, timeEnd) {
  const start = bucketFor(Math.min(timeBegin, timeEnd));
  const end = bucketFor(Math.max(timeBegin, timeEnd));
  const buckets = [];
  for (let bucket = start; bucket <= end; bucket += 1) {
    buckets.push(bucket);
  }
  return buckets;
}

function bucketFor(time) {
  return Math.floor(Number(time) / BUCKET_MS);
}

function normalizeIp(ip) {
  return String(ip || "")
    .trim()
    .replace(/\/32$/, "")
    .replace(/\/128$/, "");
}

function sqlNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return String(number);
}

function sqlString(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
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

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function onceExit(child) {
  return new Promise((resolveExit) => {
    child.on("close", resolveExit);
  });
}

function onceFinished(stream) {
  return new Promise((resolveFinished, rejectFinished) => {
    stream.on("finish", resolveFinished);
    stream.on("error", rejectFinished);
  });
}

function usage(message) {
  console.error(message);
  console.error("Usage: node scripts/export-postgres-to-d1-sql.mjs --ssh root@165.227.84.216 --out tmp/prod-d1-data.sql");
  process.exit(1);
}

#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const args = parseArgs(process.argv.slice(2));
const dir = args.dir || "tmp/prod-d1-data-chunks";
const database = args.database || "exhausting-a-crowd";
const remote = Boolean(args.remote);
const start = Number(args.start || 1);
const retries = Number(args.retries || 5);
const delayMs = Number(args.delay || 2500);

if (!Number.isFinite(start) || start < 1) {
  usage("Invalid --start value.");
}

const files = (await readdir(dir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (let index = start - 1; index < files.length; index += 1) {
  const file = files[index];
  const chunkNumber = index + 1;
  const fullPath = join(dir, file);
  const logPath = join("tmp", `${file.replace(/\.sql$/, "")}.remote.log`);

  let attempt = 0;
  while (true) {
    attempt += 1;
    console.log(`importing ${file} (${chunkNumber}/${files.length}), attempt ${attempt}`);
    const result = await runWrangler(database, fullPath, remote);
    await writeFile(logPath, result.output);

    if (result.code === 0) {
      break;
    }

    if (attempt >= retries) {
      console.error(tail(result.output, 80));
      process.exit(result.code || 1);
    }

    console.error(`chunk ${file} failed; retrying in ${delayMs}ms`);
    console.error(tail(result.output, 20));
    await sleep(delayMs);
  }

  await sleep(delayMs);
}

function runWrangler(databaseName, file, useRemote) {
  const commandArgs = ["wrangler", "d1", "execute", databaseName, `--file=${file}`];
  if (useRemote) {
    commandArgs.splice(4, 0, "--remote");
  }

  return new Promise((resolve) => {
    const child = spawn("npx", commandArgs, {
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("close", (code) => {
      resolve({ code, output });
    });
  });
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

function tail(value, lines) {
  return value.split("\n").slice(-lines).join("\n");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function usage(message) {
  console.error(message);
  console.error("Usage: node scripts/import-d1-chunks.mjs --dir tmp/prod-d1-data-chunks --database exhausting-a-crowd --remote [--start 1]");
  process.exit(1);
}

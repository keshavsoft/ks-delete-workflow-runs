#!/usr/bin/env node

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import getLatestVersion from "./core/getLatestVersion.js";
import loadRunner from "./core/loadRunner.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

const showHelp = () => {
  console.log(`
ks-delete-workflow-runs CLI

Usage:
  npx ks-delete-workflow-runs [options]

Options:
  --repo=<repoName>     Name of the target GitHub repository (default: reads package.json name from current directory)
  --owner=<ownerName>   GitHub repository owner (default: 'keshavsoft')
  --token=<token>       GitHub Token or PAT (default: GITHUB_TOKEN or GH_PAT env variables)
  --apiVersion=<version> API version to use (e.g. v1) (default: latest version)
  -h, --help            Show this help message
`);
};

const run = async () => {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
      showHelp();
      process.exit(0);
  }

  // Parse args helper
  const getArgValue = (argName) => {
    const option = args.find(arg => arg.startsWith(`--${argName}=`));
    if (option) return option.split('=')[1];
    return null;
  };

  const repo = getArgValue('repo') || undefined;
  const owner = getArgValue('owner') || undefined;
  const token = getArgValue('token') || getArgValue('pat') || undefined;
  const apiVersion = getArgValue('apiVersion') || undefined;

  const version = apiVersion || getLatestVersion();

  const runner = await loadRunner(version);

  try {
      await runner({ repo, owner, token, version });
  } catch (error) {
      console.error(`\x1b[31mRuntime Error: ${error.message}\x1b[0m`);
      process.exit(1);
  }
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});

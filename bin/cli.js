#!/usr/bin/env node

import deleteWorkflowRuns from '../index.js';

const args = process.argv.slice(2);

const showHelp = () => {
  console.log(`
ks-delete-workflow-runs CLI

Usage:
  npx ks-delete-workflow-runs [options]

Options:
  --repo=<repoName>   Name of the target GitHub repository (default: reads package.json name from current directory)
  --owner=<ownerName> GitHub repository owner (default: 'keshavsoft')
  --token=<token>     GitHub Token or PAT (default: GITHUB_TOKEN or GH_PAT env variables)
  -h, --help          Show this help message
`);
};

if (args.includes('-h') || args.includes('--help')) {
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

deleteWorkflowRuns({ repo, owner, token }).catch(error => {
  console.error('💥 An error occurred:', error.message);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';

// Helper to load env variables from a .env file in CWD if it exists
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.length > 0 && value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

export default async function deleteWorkflowRuns(options = {}) {
  // Load local env file if present
  loadEnv();

  let owner = options.owner || 'keshavsoft';
  let token = options.token || process.env.GITHUB_TOKEN || process.env.GH_PAT;
  let repo = options.repo;

  // Default repo to package.json name if not specified
  if (!repo) {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        repo = pkg.name;
      } catch (e) {
        // ignore
      }
    }
  }

  if (!repo) {
    throw new Error('Repository name not specified. Use options.repo or run in a directory with a package.json.');
  }

  if (!token) {
    throw new Error('GitHub Token or PAT not provided. Set GITHUB_TOKEN or GH_PAT in environment or pass options.token.');
  }

  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+v3+json',
    'User-Agent': 'NodeJS-Workflow-Cleaner'
  };

  async function getRuns(page = 1) {
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=100&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch runs: ${res.statusText} (${res.status})`);
    }
    const data = await res.json();
    return data.workflow_runs || [];
  }

  async function deleteRun(runId) {
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;
    const res = await fetch(url, { method: 'DELETE', headers });
    return res.ok;
  }

  console.log(`Target Repository: ${owner}/${repo}`);
  console.log('🔄 Fetching workflow runs...');

  let totalDeleted = 0;

  while (true) {
    const runs = await getRuns(1);
    if (runs.length === 0) {
      break;
    }

    console.log(`🗑️ Found ${runs.length} workflow runs. Deleting...`);
    let deletedInThisLoop = 0;

    for (const run of runs) {
      console.log(`Deleting run #${run.id} (${run.name} - ${run.head_branch})...`);
      const success = await deleteRun(run.id);
      if (success) {
        console.log(`  ✅ Run #${run.id} deleted.`);
        deletedInThisLoop++;
        totalDeleted++;
      } else {
        console.log(`  ❌ Failed to delete run #${run.id}.`);
      }
    }

    // Safety check to prevent infinite loop
    if (deletedInThisLoop === 0) {
      console.warn('⚠️ Warning: No runs were successfully deleted in this loop. Aborting to prevent infinite loop.');
      break;
    }

    if (runs.length < 100) {
      break;
    }
    console.log('🔄 Checking for next page of runs...');
  }

  console.log(`🎉 All runs processed! Total deleted: ${totalDeleted}`);
  return { success: true, totalDeleted };
}

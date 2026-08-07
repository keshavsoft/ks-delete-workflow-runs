import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

async function publish() {
  loadEnv();

  const token = process.env.NPM_TOKEN;
  if (!token) {
    console.error('❌ Error: NPM_TOKEN is not defined in .env file.');
    process.exit(1);
  }

  // Read package.json
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('❌ Error: package.json not found in current directory.');
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const name = pkg.name;
  const version = pkg.version;

  console.log(`Package: ${name}@${version}`);

  // Check if version is already published
  let alreadyPublished = false;
  try {
    const stdout = execSync(`npm view ${name}@${version} version`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (stdout === version) {
      alreadyPublished = true;
    }
  } catch (e) {
    // Package or version doesn't exist on npm registry yet
  }

  if (alreadyPublished) {
    console.log(`⚠️ Version ${version} is already published on NPM. Skipping publish.`);
    return;
  }

  console.log(`🚀 Publishing version ${version} to NPM...`);
  const npmrcPath = path.resolve(process.cwd(), '.npmrc');
  const npmrcBackupExists = fs.existsSync(npmrcPath);
  let backupContent = '';
  if (npmrcBackupExists) {
    backupContent = fs.readFileSync(npmrcPath, 'utf8');
  }

  try {
    // Write temporary .npmrc config with token
    fs.writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${token}\n`);
    execSync('npm publish', { stdio: 'inherit' });
    console.log('✅ Successfully published to NPM!');
  } catch (err) {
    console.error('❌ NPM publish failed:', err.message);
    process.exit(1);
  } finally {
    // Restore or clean up .npmrc
    if (npmrcBackupExists) {
      fs.writeFileSync(npmrcPath, backupContent);
    } else if (fs.existsSync(npmrcPath)) {
      fs.unlinkSync(npmrcPath);
    }
  }
}

publish();

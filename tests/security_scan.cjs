const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const trackedAndUntracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  cwd: root,
  encoding: 'utf8'
}).trim().split('\n').filter(Boolean);
const secretPattern = /(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|cfut_[A-Za-z0-9]{20,}|vcp_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]+PRIVATE KEY-----|authorization\s*:\s*bearer\s+[A-Za-z0-9._-]{20,})/i;
const forbiddenSecretFiles = /(^|\/)(\.env(\..*)?|id_rsa|.*\.pem|.*\.key)$/i;
const findings = [];

for (const relative of trackedAndUntracked) {
  if (relative === '.env.example' || relative.includes('node_modules/')) continue;
  if (forbiddenSecretFiles.test(relative)) findings.push(`forbidden secret-looking file: ${relative}`);
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;
  const content = fs.readFileSync(absolute);
  if (secretPattern.test(content.toString('utf8'))) findings.push(`credential pattern in: ${relative}`);
}

const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
for (const required of ['.env', '.env.*', '/evidence/', '/source-salsa/', '/tools/']) {
  if (!ignore.includes(required)) findings.push(`.gitignore missing: ${required}`);
}
if (!fs.existsSync(path.join(root, 'site', 'index.html'))) findings.push('deployable site/index.html missing');
if (findings.length) {
  console.error('FAIL security scan');
  findings.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
console.log(`PASS security scan (${trackedAndUntracked.length} repository files checked)`);

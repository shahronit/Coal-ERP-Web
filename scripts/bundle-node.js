const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, '..', 'resources', 'node');
const targetPath = path.join(targetDir, process.platform === 'win32' ? 'node.exe' : 'node');

const resolveSourceNode = () => {
  if (process.env.TRADECRM_NODE_BIN && fs.existsSync(process.env.TRADECRM_NODE_BIN)) {
    return process.env.TRADECRM_NODE_BIN;
  }
  return execSync('command -v node', { encoding: 'utf8' }).trim();
};

const sourceNode = resolveSourceNode();
fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(sourceNode, targetPath);
if (process.platform !== 'win32') {
  fs.chmodSync(targetPath, 0o755);
}

console.log(`Bundled Node for desktop migrations: ${targetPath}`);

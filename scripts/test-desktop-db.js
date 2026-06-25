const path = require('path');
const os = require('os');

const resourcesPath = process.argv[2];
if (!resourcesPath) {
  console.error('Usage: node test-desktop-db.js <resourcesPath>');
  process.exit(1);
}

process.resourcesPath = resourcesPath;
process.env.TRADECRM_BACKEND_DIR = path.join(resourcesPath, 'backend');
process.env.TRADECRM_NODE_BIN = path.join(resourcesPath, 'node', 'node');
process.env.TRADECRM_USER_DATA_DIR = path.join(os.homedir(), 'Library/Application Support/coal-trading-erp');
process.env.TRADECRM_DATA_DIR = path.join(process.env.TRADECRM_USER_DATA_DIR, 'data');
process.env.TRADECRM_DATABASE_PATH = path.join(process.env.TRADECRM_DATA_DIR, 'tradecrm.db');
process.env.TRADECRM_SETTINGS_PATH = path.join(process.env.TRADECRM_USER_DATA_DIR, 'settings.json');
process.env.TRADECRM_SECRETS_PATH = path.join(process.env.TRADECRM_USER_DATA_DIR, 'secrets.json');
process.env.UPLOAD_DIR = path.join(process.env.TRADECRM_USER_DATA_DIR, 'uploads');
process.env.NODE_PATH = path.join(process.env.TRADECRM_BACKEND_DIR, 'node_modules');
require('module').Module._initPaths();

const { ensureDesktopDatabase } = require(path.join(process.env.TRADECRM_BACKEND_DIR, 'src/desktop/firstRun'));

ensureDesktopDatabase()
  .then(() => {
    console.log('DB OK');
  })
  .catch((error) => {
    console.error('DB FAIL', error);
    process.exit(1);
  });

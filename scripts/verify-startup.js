const crypto = require('crypto');
const fs = require('fs');
const net = require('net');
const path = require('path');
const os = require('os');

const log = (message, extra) => {
  if (extra) console.log(`[startup] ${message}`, extra);
  else console.log(`[startup] ${message}`);
};

const resourcesPath = process.env.TRADECRM_RESOURCES_PATH
  || '/Applications/Coal Trading ERP.app/Contents/Resources';
const userDataDir = path.join(os.homedir(), 'Library/Application Support/coal-trading-erp');
const dataDir = path.join(userDataDir, 'data');
const databasePath = path.join(dataDir, 'tradecrm.db');
const backendRoot = path.join(resourcesPath, 'backend');

const getFreePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(() => resolve(port));
  });
  server.on('error', reject);
});

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
};

(async () => {
  try {
    const port = await getFreePort();
    const secretsPath = path.join(userDataDir, 'secrets.json');
    const settingsPath = path.join(userDataDir, 'settings.json');
    const secrets = readJson(secretsPath, null) || {
      jwtAccessSecret: crypto.randomBytes(48).toString('hex'),
      jwtRefreshSecret: crypto.randomBytes(48).toString('hex'),
    };

    process.resourcesPath = resourcesPath;
    process.env.NODE_ENV = 'production';
    process.env.HOST = '127.0.0.1';
    process.env.PORT = String(port);
    process.env.TRADECRM_USER_DATA_DIR = userDataDir;
    process.env.TRADECRM_DATA_DIR = dataDir;
    process.env.TRADECRM_DATABASE_PATH = databasePath;
    process.env.TRADECRM_SETTINGS_PATH = settingsPath;
    process.env.TRADECRM_SECRETS_PATH = secretsPath;
    process.env.TRADECRM_BACKEND_DIR = backendRoot;
    process.env.UPLOAD_DIR = path.join(userDataDir, 'uploads');
    process.env.NODE_PATH = path.join(backendRoot, 'node_modules');
    require('module').Module._initPaths();
    const { toSqliteDatabaseUrl } = require(path.join(backendRoot, 'src/utils/sqliteUrl'));
    process.env.DATABASE_URL = toSqliteDatabaseUrl(databasePath);
    process.env.JWT_ACCESS_SECRET = secrets.jwtAccessSecret;
    process.env.JWT_REFRESH_SECRET = secrets.jwtRefreshSecret;
    process.env.TRADECRM_STATIC_DIR = path.join(resourcesPath, 'frontend/dist');
    process.env.FRONTEND_URL = `http://127.0.0.1:${port}`;

    log('ensureDesktopDatabase');
    const { ensureDesktopDatabase } = require(path.join(backendRoot, 'src/desktop/firstRun'));
    await ensureDesktopDatabase();
    log('ensureDesktopDatabase ok');

    log('startServer', { port });
    const { startServer, stopServer } = require(path.join(backendRoot, 'src/server'));
    await startServer({ port, host: '127.0.0.1' });
    log('startServer ok');

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ronit.shah2010@gmail.com', password: 'Demo@123' }),
    });
    log('login status', res.status);
    console.log(await res.text());

    await stopServer();
    log('done');
  } catch (error) {
    console.error('[startup] FAIL', error);
    process.exit(1);
  }
})();

#!/usr/bin/env node
/**
 * Free a TCP port before starting dev (avoids Vite falling back to 5174
 * while Electron still waits on 5173).
 */
const { execSync } = require('child_process');

const port = process.argv[2] || '5173';

const killWindowsPort = () => {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();

    output.split('\n').forEach((line) => {
      if (!line.includes('LISTENING')) return;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    });

    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[predev] Stopped process ${pid} on port ${port}`);
      } catch {
        // already gone
      }
    });
  } catch {
    // port is free
  }
};

const killUnixPort = () => {
  try {
    const pids = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
    if (!pids) return;

    pids.split('\n').filter(Boolean).forEach((pid) => {
      try {
        process.kill(Number(pid), 'SIGTERM');
        console.log(`[predev] Stopped process ${pid} on port ${port}`);
      } catch {
        // already gone
      }
    });
  } catch {
    // port is free
  }
};

if (process.platform === 'win32') {
  killWindowsPort();
} else {
  killUnixPort();
}

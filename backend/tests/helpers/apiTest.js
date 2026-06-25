const path = require('path');

const backendRoot = path.join(__dirname, '../..');
require('dotenv').config({ path: path.join(backendRoot, '.env'), override: true });

if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(backendRoot, process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

const assert = require('node:assert/strict');

const createApiClient = (baseUrl, token = null) => {
  const headers = (extra = {}) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  });

  const request = async (method, urlPath, body) => {
    const res = await fetch(`${baseUrl}${urlPath}`, {
      method,
      headers: headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let json = null;
    const text = await res.text();
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    return { status: res.status, body: json, ok: res.ok };
  };

  return {
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b),
    put: (p, b) => request('PUT', p, b),
    delete: (p) => request('DELETE', p),
    setToken: (t) => { token = t; },
  };
};

const expectOk = (res, label) => {
  assert.ok(res.ok, `${label}: expected 2xx got ${res.status} — ${JSON.stringify(res.body?.message || res.body?.errors || res.body)}`);
  assert.equal(res.body?.success, true, `${label}: success flag false`);
  return res.body;
};

const expectStatus = (res, status, label) => {
  assert.equal(res.status, status, `${label}: expected ${status} got ${res.status} — ${JSON.stringify(res.body)}`);
  return res.body;
};

const expectFail = (res, status, label) => {
  assert.equal(res.status, status, `${label}: expected ${status} got ${res.status}`);
  assert.notEqual(res.body?.success, true, `${label}: should not succeed`);
};

const round2 = (n) => Math.round(Number(n) * 100) / 100;

module.exports = {
  backendRoot,
  createApiClient,
  expectOk,
  expectStatus,
  expectFail,
  round2,
};

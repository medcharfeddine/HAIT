require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
// Allow Render (or other hosts) to provide a persistent data directory via DATA_DIR
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const storesFile = path.join(dataDir, 'stores.json');
const tripsFile = path.join(dataDir, 'trips.json');
const PORT = process.env.PORT || 3000;
// Simple CORS allow; you can set ALLOWED_ORIGIN env var for stricter policy
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readJson(filePath, defaultValue) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return defaultValue;
  }
}

function writeJson(filePath, value) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function defaultStores() {
  const stores = [];
  for (let i = 1; i <= 33; i++) {
    stores.push({ code: 'B' + String(i).padStart(2, '0'), ville: '' });
  }
  return stores;
}

ensureDataDir();
if (!fs.existsSync(storesFile)) {
  writeJson(storesFile, defaultStores());
}
if (!fs.existsSync(tripsFile)) {
  writeJson(tripsFile, []);
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Basic CORS support so frontends (Vercel, mobile) can call this API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    return res.sendStatus(200);
  }
  next();
});

// Health check for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', dataDir, pid: process.pid });
});

// Expose runtime config (e.g. Firebase client config) to the frontend.
// Set env vars: FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
// FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID
app.get('/config.json', (req, res) => {
  const cfg = {
    apiKey: process.env.FIREBASE_API_KEY || null,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || null,
    projectId: process.env.FIREBASE_PROJECT_ID || null,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || null,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || null,
    appId: process.env.FIREBASE_APP_ID || null
  };
  const hasAny = Object.values(cfg).some(v => v);
  if (hasAny) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(cfg));
    return;
  }

  const localConfigPath = path.join(__dirname, 'config.json');
  let localCfg = {};
  if (fs.existsSync(localConfigPath)) {
    try {
      localCfg = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
    } catch (err) {
      console.error('Failed to read local config.json', err);
    }
  }

  const hasLocal = Object.values(localCfg).some(v => v);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify(hasLocal ? localCfg : {}));
});

app.get('/api/data', (req, res) => {
  res.json({
    stores: readJson(storesFile, defaultStores()),
    trips: readJson(tripsFile, [])
  });
});

app.get('/api/stores', (req, res) => {
  res.json(readJson(storesFile, defaultStores()));
});

app.get('/api/trips', (req, res) => {
  res.json(readJson(tripsFile, []));
});

app.post('/api/stores', (req, res) => {
  const stores = Array.isArray(req.body) ? req.body : [];
  writeJson(storesFile, stores);
  res.json({ stores });
});

app.post('/api/trips', (req, res) => {
  const trips = Array.isArray(req.body) ? req.body : [];
  writeJson(tripsFile, trips);
  res.json({ trips });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data directory: ${dataDir}`);
});

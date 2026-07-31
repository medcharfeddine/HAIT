const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const dataDir = path.join(__dirname, 'data');
const storesFile = path.join(dataDir, 'stores.json');
const tripsFile = path.join(dataDir, 'trips.json');
const PORT = process.env.PORT || 3000;

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
  console.log(`Server running at http://localhost:${PORT}`);
});

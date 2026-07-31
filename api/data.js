const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const storesFile = path.join(dataDir, 'stores.json');
const tripsFile = path.join(dataDir, 'trips.json');

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

function defaultStores() {
  const stores = [];
  for (let i = 1; i <= 33; i++) {
    stores.push({ code: 'B' + String(i).padStart(2, '0'), ville: '' });
  }
  return stores;
}

module.exports = (req, res) => {
  ensureDataDir();
  const stores = readJson(storesFile, defaultStores());
  const trips = readJson(tripsFile, []);
  res.status(200).json({ stores, trips });
};

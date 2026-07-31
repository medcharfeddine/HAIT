const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const storesFile = path.join(dataDir, 'stores.json');

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

module.exports = (req, res) => {
  if (req.method === 'GET') {
    ensureDataDir();
    const stores = readJson(storesFile, []);
    res.status(200).json(stores);
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const stores = JSON.parse(body);
        writeJson(storesFile, stores);
        res.status(200).json({ stores });
      } catch (err) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};

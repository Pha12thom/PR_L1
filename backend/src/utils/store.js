const fs = require('fs');
const path = require('path');
const { dataFile } = require('../config/env');

const ensureDataFile = () => {
  const dir = path.dirname(dataFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
      dataFile,
      JSON.stringify({ users: [], reports: [], contacts: [] }, null, 2)
    );
  }
};

const readStore = () => {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
};

const writeStore = (store) => {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
};

module.exports = {
  readStore,
  writeStore,
};

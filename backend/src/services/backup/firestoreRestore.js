const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const { getFirestore, getStorageBucket } = require('../../config/firestore');
const { toFirestoreValue } = require('../../db/firestore/converters');

const restoreFirestoreFromArchive = async (zipPath, uploadDir) => {
  const tempDir = path.join(path.dirname(zipPath), `.restore-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    await extract(zipPath, { dir: tempDir });
    const dataDir = fs.existsSync(path.join(tempDir, 'firestore'))
      ? path.join(tempDir, 'firestore')
      : tempDir;

    const db = getFirestore();
    const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json') && f !== 'manifest.json');

    for (const file of files) {
      const collectionName = file.replace(/\.json$/, '');
      const rows = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const batchSize = 400;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = db.batch();
        rows.slice(i, i + batchSize).forEach((row) => {
          const { id, ...rest } = row;
          const docId = collectionName === 'appSettings' && !id ? 'global' : id;
          batch.set(db.collection(collectionName).doc(docId), toFirestoreValue(rest));
        });
        await batch.commit();
      }
    }

    const uploadsSource = path.join(tempDir, 'uploads');
    if (fs.existsSync(uploadsSource) && uploadDir) {
      const bucket = getStorageBucket();
      if (bucket) {
        const uploads = [];
        const walk = (dir, prefix = '') => {
          fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              walk(full, `${prefix}${entry.name}/`);
            } else {
              uploads.push(
                bucket.upload(full, { destination: `uploads/${prefix}${entry.name}` }),
              );
            }
          });
        };
        walk(uploadsSource);
        await Promise.all(uploads);
      } else {
        fs.rmSync(uploadDir, { recursive: true, force: true });
        fs.mkdirSync(uploadDir, { recursive: true });
        fs.cpSync(uploadsSource, uploadDir, { recursive: true });
      }
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

module.exports = { restoreFirestoreFromArchive };

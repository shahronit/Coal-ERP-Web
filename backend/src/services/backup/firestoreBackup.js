const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { getFirestore, getStorageBucket } = require('../../config/firestore');
const { MODEL_TO_COLLECTION } = require('../../db/collections');
const { fromFirestoreValue } = require('../../db/firestore/converters');
const logger = require('../../config/logger');

const exportFirestoreToJson = async (targetDir) => {
  fs.mkdirSync(targetDir, { recursive: true });
  const db = getFirestore();
  const manifest = {};

  await Promise.all(Object.values(MODEL_TO_COLLECTION).map(async (collectionName) => {
    const snap = await db.collection(collectionName).get();
    const rows = snap.docs.map((doc) => fromFirestoreValue({ id: doc.id, ...doc.data() }));
    manifest[collectionName] = rows.length;
    fs.writeFileSync(
      path.join(targetDir, `${collectionName}.json`),
      JSON.stringify(rows, null, 2),
    );
  }));

  fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
};

const downloadStorageUploads = async (targetDir) => {
  fs.mkdirSync(targetDir, { recursive: true });
  const bucket = getStorageBucket();
  if (!bucket) return 0;
  const [files] = await bucket.getFiles({ prefix: 'uploads/' });
  let count = 0;
  for (const file of files) {
    const dest = path.join(targetDir, file.name);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await file.download({ destination: dest });
    count += 1;
  }
  return count;
};

const zipDirectory = (sourceDir, zipPath) => new Promise((resolve, reject) => {
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', resolve);
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(sourceDir, false);
  archive.finalize();
});

const createFirestoreBackupArchive = async (zipPath) => {
  const tempRoot = path.join(path.dirname(zipPath), `.firestore-backup-${Date.now()}`);
  const dataDir = path.join(tempRoot, 'firestore');
  const uploadsDir = path.join(tempRoot, 'uploads');

  try {
    const manifest = await exportFirestoreToJson(dataDir);
    const fileCount = await downloadStorageUploads(uploadsDir);
    logger.info('Firestore backup exported', { manifest, storageFiles: fileCount });
    await zipDirectory(tempRoot, zipPath);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
};

module.exports = {
  exportFirestoreToJson,
  downloadStorageUploads,
  createFirestoreBackupArchive,
};

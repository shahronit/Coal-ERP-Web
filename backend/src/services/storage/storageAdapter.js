const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../../config');
const { getStorageBucket } = require('../../config/firestore');
const { isFirestore } = require('../../db');
const logger = require('../../config/logger');

const useFirebaseStorage = () => isFirestore() && Boolean(config.firebase.storageBucket);

const localUploadDir = () => config.uploadDir;

const uploadFile = async (file, destPath) => {
  if (!useFirebaseStorage()) {
    return { storagePath: file.path, localPath: file.path };
  }
  const bucket = getStorageBucket();
  if (!bucket) throw new Error('Firebase Storage bucket not configured');
  const objectPath = destPath || `uploads/${file.filename}`;
  await bucket.upload(file.path, {
    destination: objectPath,
    metadata: { contentType: file.mimetype },
  });
  try {
    fs.unlinkSync(file.path);
  } catch {
    // temp file may already be removed
  }
  return { storagePath: objectPath, localPath: null };
};

const resolveLocalPath = (storagePath) => {
  if (!storagePath) return null;
  if (fs.existsSync(storagePath)) return storagePath;
  const underUploads = path.join(localUploadDir(), path.basename(storagePath));
  if (fs.existsSync(underUploads)) return underUploads;
  return null;
};

const downloadToTemp = async (storagePath) => {
  const local = resolveLocalPath(storagePath);
  if (local) return local;

  if (!useFirebaseStorage()) {
    throw new Error('File not found on disk');
  }

  const bucket = getStorageBucket();
  const tempPath = path.join(os.tmpdir(), `tradecrm-dl-${Date.now()}-${path.basename(storagePath)}`);
  await bucket.file(storagePath).download({ destination: tempPath });
  return tempPath;
};

const deleteFile = async (storagePath) => {
  const local = resolveLocalPath(storagePath);
  if (local && fs.existsSync(local)) {
    fs.unlinkSync(local);
    return;
  }
  if (useFirebaseStorage() && storagePath) {
    const bucket = getStorageBucket();
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
  }
};

const listUploadObjects = async (prefix = 'uploads/') => {
  if (!useFirebaseStorage()) {
    const dir = localUploadDir();
    if (!fs.existsSync(dir)) return [];
    const walk = (base) => {
      const entries = fs.readdirSync(base, { withFileTypes: true });
      return entries.flatMap((entry) => {
        const full = path.join(base, entry.name);
        if (entry.isDirectory()) return walk(full);
        return [{ localPath: full, storagePath: path.relative(dir, full) }];
      });
    };
    return walk(dir);
  }
  const bucket = getStorageBucket();
  const [files] = await bucket.getFiles({ prefix });
  return files.map((f) => ({ storagePath: f.name }));
};

module.exports = {
  useFirebaseStorage,
  uploadFile,
  downloadToTemp,
  deleteFile,
  listUploadObjects,
  resolveLocalPath,
};

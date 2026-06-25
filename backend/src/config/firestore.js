const admin = require('firebase-admin');
const config = require('./index');

let app;
let db;
let bucket;

const initFirebase = () => {
  if (app) return { app, db, bucket };

  const projectId = config.firebase.projectId;
  const options = { projectId };

  if (config.firebase.storageBucket) {
    options.storageBucket = config.firebase.storageBucket;
  }

  if (admin.apps.length === 0) {
    app = admin.initializeApp(options);
  } else {
    app = admin.app();
  }

  db = admin.firestore();
  bucket = config.firebase.storageBucket
    ? admin.storage().bucket(config.firebase.storageBucket)
    : null;

  return { app, db, bucket };
};

const getFirestore = () => {
  if (!db) initFirebase();
  return db;
};

const getStorageBucket = () => {
  if (!bucket) initFirebase();
  return bucket;
};

module.exports = {
  initFirebase,
  getFirestore,
  getStorageBucket,
  admin,
};

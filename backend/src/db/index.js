const config = require('../config');
const logger = require('../config/logger');

const getPrismaModule = () => require('../config/prismaClient');

const isFirestore = () => config.isFirestoreProvider;
const isPostgres = () => config.databaseProvider === 'postgres';

let firestoreClient;

const getDb = () => {
  if (isFirestore()) {
    if (!firestoreClient) {
      const FirestoreClient = require('./firestore/client');
      firestoreClient = new FirestoreClient();
    }
    return firestoreClient;
  }
  return getPrismaModule();
};

const connectDatabase = async () => {
  if (isFirestore()) {
    const { initFirebase } = require('../config/firestore');
    initFirebase();
    logger.info(`Database connected: Firestore (${config.firebase.projectId})`);
    return getDb();
  }
  return getPrismaModule().connectDatabase();
};

const disconnectDatabase = async () => {
  if (isFirestore()) {
    firestoreClient = null;
    return;
  }
  return getPrismaModule().disconnectDatabase();
};

module.exports = {
  getDb,
  connectDatabase,
  disconnectDatabase,
  isFirestore,
  isPostgres,
};

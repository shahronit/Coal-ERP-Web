const { getDb, isFirestore, isPostgres } = require('./index');
const { MODEL_TO_COLLECTION } = require('./collections');

const getRepository = (model) => {
  const db = getDb();
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  if (!db[key]) {
    throw new Error(`Repository not found for model: ${model}`);
  }
  return db[key];
};

const listCollections = () => Object.keys(MODEL_TO_COLLECTION);

module.exports = {
  getDb,
  getRepository,
  isFirestore,
  isPostgres,
  listCollections,
};

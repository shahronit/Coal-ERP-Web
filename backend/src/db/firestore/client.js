const { getFirestore } = require('../../config/firestore');
const { MODEL_TO_COLLECTION } = require('../collections');
const ModelDelegate = require('./modelDelegate');
const { INCLUDE_MAP } = require('./relations');
const { docToRecord } = require('./converters');

const MODEL_NAMES = Object.keys(MODEL_TO_COLLECTION);

class FirestoreClient {
  constructor({ transaction = null, db = null } = {}) {
    this.db = db || getFirestore();
    this.transaction = transaction;
    MODEL_NAMES.forEach((model) => {
      this[model] = new ModelDelegate(model, this);
    });
  }

  async resolveInclude(model, record, include) {
    if (!record || !include) return record;
    const map = INCLUDE_MAP[model] || {};
    const result = { ...record };

    await Promise.all(Object.entries(include).map(async ([key, spec]) => {
      const rel = map[key];
      if (!rel) return;

      if (rel.reverse) {
        const where = { [rel.fk]: record.id, deletedAt: null };
        let children = await this[rel.model].findMany({
          where,
          include: typeof spec === 'object' && spec.include ? spec.include : undefined,
        });
        if (rel.single) {
          result[key] = children[0] || null;
        } else {
          result[key] = children;
        }
        return;
      }

      const fk = record[rel.fk];
      if (!fk) {
        result[key] = null;
        return;
      }
      const related = await this[rel.model].findUnique({
        where: { id: fk },
        include: typeof spec === 'object' && spec.include ? spec.include : undefined,
      });
      result[key] = related;
    }));

    return result;
  }

  async $transaction(callbackOrArray) {
    if (Array.isArray(callbackOrArray)) {
      return Promise.all(callbackOrArray);
    }
    // Firestore native transactions require all reads before any writes.
    // Prisma-style callbacks interleave reads/writes (create → findFirst with includes).
    // Run sequentially with immediate commits so reads after writes see persisted data.
    const tx = new FirestoreClient({ db: this.db });
    return callbackOrArray(tx);
  }

  async $connect() {
    return this;
  }

  async $disconnect() {
    return undefined;
  }

  async $queryRaw() {
    throw new Error('Raw SQL not supported on Firestore. Use dashboard aggregation helpers.');
  }

  async $executeRawUnsafe() {
    throw new Error('Raw SQL not supported on Firestore.');
  }

  isPostgres() {
    return false;
  }

  isSqlite() {
    return false;
  }

  isFirestore() {
    return true;
  }
}

module.exports = FirestoreClient;

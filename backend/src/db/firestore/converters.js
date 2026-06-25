const { Timestamp, FieldValue } = require('firebase-admin/firestore');

const isPrismaDecimal = (v) => v && typeof v === 'object' && typeof v.toNumber === 'function' && typeof v.toFixed === 'function';

const isPlainObject = (v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || v instanceof Date) return false;
  if (isPrismaDecimal(v)) return false;
  return true;
};

const toFirestoreValue = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (isPrismaDecimal(value)) return Number(value.toString());
  if (Array.isArray(value)) return value.map(toFirestoreValue).filter((v) => v !== undefined);
  if (isPlainObject(value)) {
    const out = {};
    Object.entries(value).forEach(([k, v]) => {
      const converted = toFirestoreValue(v);
      if (converted !== undefined) out[k] = converted;
    });
    return out;
  }
  return value;
};

const fromFirestoreValue = (value) => {
  if (value === null || value === undefined) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(fromFirestoreValue);
  if (isPlainObject(value)) {
    const out = {};
    Object.entries(value).forEach(([k, v]) => {
      out[k] = fromFirestoreValue(v);
    });
    return out;
  }
  return value;
};

const docToRecord = (doc) => {
  if (!doc.exists) return null;
  return fromFirestoreValue({ id: doc.id, ...doc.data() });
};

const applyIncrementOps = (existing, data) => {
  const merged = { ...existing };
  Object.entries(data).forEach(([key, val]) => {
    if (val && typeof val === 'object' && ('increment' in val || 'decrement' in val)) {
      const current = Number(merged[key] || 0);
      if (val.increment !== undefined) merged[key] = current + Number(val.increment);
      if (val.decrement !== undefined) merged[key] = current - Number(val.decrement);
    } else {
      merged[key] = val;
    }
  });
  return merged;
};

module.exports = {
  toFirestoreValue,
  fromFirestoreValue,
  docToRecord,
  applyIncrementOps,
  FieldValue,
};

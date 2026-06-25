const { v4: uuidv4 } = require('uuid');
const { getCollectionName } = require('../collections');
const { toFirestoreValue, docToRecord, applyIncrementOps } = require('./converters');
const { INCLUDE_MAP, NESTED_WHERE } = require('./relations');
const { matchesFilter, sortRecords, paginateRecords, sumField, groupRecords } = require('./queryBuilder');

class ModelDelegate {
  constructor(model, client) {
    this.model = model;
    this.client = client;
    this.collectionName = getCollectionName(model);
  }

  col() {
    return this.client.db.collection(this.collectionName);
  }

  async fetchAllDocs() {
    const snap = await this.col().get();
    return snap.docs.map(docToRecord);
  }

  async resolveNestedWhere(where) {
    if (!where) return where;
    const nested = NESTED_WHERE[this.model];
    if (!nested) return where;

    let resolved = { ...where };
    for (const [relationKey, config] of Object.entries(nested)) {
      if (!resolved[relationKey]) continue;
      const nestedWhere = resolved[relationKey];
      delete resolved[relationKey];
      const related = await this.client[config.target].findMany({ where: nestedWhere });
      const ids = related.map((r) => r.id);
      resolved[config.via] = { in: ids.length ? ids : ['__none__'] };
    }
    return resolved;
  }

  async findMany(args = {}) {
    const { where = {}, orderBy, skip, take, include, select } = args;
    const resolvedWhere = await this.resolveNestedWhere(where);
    let records = await this.fetchAllDocs();
    records = records.filter((r) => matchesFilter(r, resolvedWhere));
    records = sortRecords(records, orderBy);
    records = paginateRecords(records, { skip, take });

    if (select) {
      records = records.map((r) => {
        const picked = {};
        Object.keys(select).forEach((k) => {
          if (select[k]) picked[k] = r[k];
        });
        return picked;
      });
    }

    if (include && Object.keys(include).length) {
      records = await Promise.all(records.map((r) => this.client.resolveInclude(this.model, r, include)));
    }
    return records;
  }

  async findFirst(args = {}) {
    const rows = await this.findMany({ ...args, take: 1 });
    return rows[0] || null;
  }

  async findUnique(args = {}) {
    const { where, include, select } = args;
    if (where?.id) {
      const doc = await this.col().doc(where.id).get();
      let record = docToRecord(doc);
      if (!record) return null;
      if (select) {
        const picked = {};
        Object.keys(select).forEach((k) => { if (select[k]) picked[k] = record[k]; });
        record = picked;
      }
      if (include) return this.client.resolveInclude(this.model, record, include);
      return record;
    }
    return this.findFirst({ where, include, select });
  }

  async count(args = {}) {
    const { where = {} } = args;
    const resolvedWhere = await this.resolveNestedWhere(where);
    const records = await this.fetchAllDocs();
    return records.filter((r) => matchesFilter(r, resolvedWhere)).length;
  }

  async create(args = {}) {
    const { data } = args;
    const id = data.id || uuidv4();
    const payload = toFirestoreValue({ ...data, id });
    delete payload.id;
    const ref = this.col().doc(id);
    await ref.set(payload);
    return { id, ...data };
  }

  async update(args = {}) {
    const { where, data } = args;
    const id = where.id;
    const ref = this.col().doc(id);
    const doc = await ref.get();
    const existing = docToRecord(doc) || {};
    const merged = applyIncrementOps(existing, data);
    delete merged.id;
    const payload = toFirestoreValue(merged);
    await ref.set(payload, { merge: true });
    return { id, ...merged };
  }

  async updateMany(args = {}) {
    const { where, data } = args;
    const rows = await this.findMany({ where });
    await Promise.all(rows.map((row) => this.update({ where: { id: row.id }, data })));
    return { count: rows.length };
  }

  async delete(args = {}) {
    const { where } = args;
    const ref = this.col().doc(where.id);
    await ref.delete();
    return { id: where.id };
  }

  async deleteMany(args = {}) {
    const { where } = args;
    const rows = await this.findMany({ where });
    await Promise.all(rows.map((row) => this.delete({ where: { id: row.id } })));
    return { count: rows.length };
  }

  async aggregate(args = {}) {
    const { where = {}, _sum = {}, _count } = args;
    const records = await this.findMany({ where });
    const result = { _sum: {}, _count: {} };
    Object.keys(_sum).forEach((field) => {
      result._sum[field] = sumField(records, field);
    });
    if (_count === true || _count?._all !== undefined) {
      result._count = records.length;
    }
    return result;
  }

  async groupBy(args = {}) {
    const { where = {}, by, _sum = {}, _count = {}, orderBy, take } = args;
    let records = groupRecords(await this.findMany({ where }), { by, _sum, _count });
    if (orderBy?._sum) {
      const [field, dir] = Object.entries(orderBy._sum)[0];
      records.sort((a, b) => {
        const av = a._sum?.[field] || 0;
        const bv = b._sum?.[field] || 0;
        return dir === 'desc' ? bv - av : av - bv;
      });
    }
    if (take) records = records.slice(0, take);
    return records;
  }

  async upsert(args = {}) {
    const { where, create, update } = args;
    if (where?.prefix_year) {
      const { prefix, year } = where.prefix_year;
      const id = `${prefix}-${year}`;
      return this.upsert({
        where: { id },
        create: { id, prefix, year, ...create },
        update,
      });
    }
    const existing = await this.findUnique({ where });
    if (existing) {
      return this.update({ where, data: update });
    }
    return this.create({ data: { ...create, ...where } });
  }
}

ModelDelegate.INCLUDE_MAP = INCLUDE_MAP;

module.exports = ModelDelegate;

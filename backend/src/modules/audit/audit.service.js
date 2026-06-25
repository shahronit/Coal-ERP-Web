const prisma = require('../../config/database');
const { paginate } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { parseAuditLog } = require('../../utils/jsonFields');

const list = async (query) => {
  const result = await paginate('auditLog', {
    ...mergeListQuery(query, { dateField: 'createdAt' }),
    searchFields: ['entity', 'action'],
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return { ...result, data: result.data.map(parseAuditLog) };
};

module.exports = { list };

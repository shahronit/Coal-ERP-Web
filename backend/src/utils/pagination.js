const prisma = require('../config/database');

const buildWhere = (searchFields, search, filters = {}) => {
  const where = { deletedAt: null };

  if (search && searchFields.length) {
    where.OR = searchFields.map(field => ({
      [field]: { contains: search },
    }));
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (value === 'true') where[key] = true;
      else if (value === 'false') where[key] = false;
      else where[key] = value;
    }
  });

  return where;
};

const paginate = async (model, {
  page = 1,
  limit = 10,
  sort = 'createdAt',
  order = 'desc',
  search,
  searchFields = ['name'],
  filters = {},
  include = {},
  select = null,
}) => {
  const where = buildWhere(searchFields, search, filters);
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const take = parseInt(limit, 10);

  const orderBy = { [sort]: order === 'asc' ? 'asc' : 'desc' };

  const [data, total] = await Promise.all([
    prisma[model].findMany({
      where,
      skip,
      take,
      orderBy,
      include: Object.keys(include).length ? include : undefined,
      select: select || undefined,
    }),
    prisma[model].count({ where }),
  ]);

  return {
    data,
    meta: {
      page: parseInt(page, 10),
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
};

const softDelete = (model, id) =>
  prisma[model].update({
    where: { id },
    data: { deletedAt: new Date() },
  });

const findById = (model, id, include = {}) =>
  prisma[model].findFirst({
    where: { id, deletedAt: null },
    include: Object.keys(include).length ? include : undefined,
  });

module.exports = { buildWhere, paginate, softDelete, findById };

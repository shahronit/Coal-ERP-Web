const prisma = require('../config/database');
const { buildWhere } = require('../utils/pagination');

class BaseRepository {
  constructor(model) {
    this.model = model;
    this.prisma = prisma;
  }

  findMany(args) {
    return prisma[this.model].findMany(args);
  }

  findFirst(args) {
    return prisma[this.model].findFirst(args);
  }

  create(args) {
    return prisma[this.model].create(args);
  }

  update(args) {
    return prisma[this.model].update(args);
  }

  count(args) {
    return prisma[this.model].count(args);
  }

  aggregate(args) {
    return prisma[this.model].aggregate(args);
  }

  async findPaginated({
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc',
    search,
    searchFields = ['name'],
    filters = {},
    include = {},
    where: extraWhere = {},
  }) {
    const where = { ...buildWhere(searchFields, search, filters), ...extraWhere };
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);
    const orderBy = { [sort]: order === 'asc' ? 'asc' : 'desc' };

    const [data, total] = await Promise.all([
      prisma[this.model].findMany({
        where,
        skip,
        take,
        orderBy,
        include: Object.keys(include).length ? include : undefined,
      }),
      prisma[this.model].count({ where }),
    ]);

    return {
      data,
      meta: { page: parseInt(page, 10), limit: take, total, totalPages: Math.ceil(total / take) },
    };
  }

  softDelete(id) {
    return prisma[this.model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  findById(id, include = {}) {
    return prisma[this.model].findFirst({
      where: { id, deletedAt: null },
      include: Object.keys(include).length ? include : undefined,
    });
  }
}

module.exports = BaseRepository;

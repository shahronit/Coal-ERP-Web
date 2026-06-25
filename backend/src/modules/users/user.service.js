const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { hashPassword } = require('../auth/auth.service');
const { paginate, softDelete, findById } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const { canDelete } = require('../../config/permissions');
const { canAssignRole } = require('../../config/roles');

const listUsers = async (query) =>
  paginate('user', {
    ...mergeListQuery(query, { filterKeys: ['role', 'isActive'] }),
    searchFields: ['name', 'email'],
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });

const getUser = async (id) => {
  const user = await findById('user', id, {});
  if (!user) throw new AppError('User not found', 404);
  const { passwordHash, ...safe } = user;
  return safe;
};

const createUser = async (data, createdById, requesterRole) => {
  if (!canAssignRole(requesterRole, data.role)) {
    throw new AppError('Not authorized to assign this role', 403);
  }
  const existing = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase(), deletedAt: null },
  });
  if (existing) throw new AppError('Email already exists', 409);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      name: data.name,
      role: data.role,
      isActive: data.isActive ?? true,
      profile: { create: {} },
    },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });
  return user;
};

const updateUser = async (id, data, requesterRole) => {
  const user = await findById('user', id);
  if (!user) throw new AppError('User not found', 404);

  if (data.role && !canAssignRole(requesterRole, data.role)) {
    throw new AppError('Not authorized to assign this role', 403);
  }
  if (data.role && user.role === 'SUPER_ADMIN' && requesterRole !== 'SUPER_ADMIN') {
    throw new AppError('Only Super Admin can modify Super Admin users', 403);
  }

  const updateData = { ...data };
  if (data.email) updateData.email = data.email.toLowerCase();
  if (data.password) updateData.passwordHash = await hashPassword(data.password);
  delete updateData.password;

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, isActive: true, updatedAt: true },
  });
};

const deleteUser = async (id, requesterRole) => {
  if (!canDelete(requesterRole)) throw new AppError('Not authorized to delete users', 403);
  const user = await findById('user', id);
  if (!user) throw new AppError('User not found', 404);
  return softDelete('user', id);
};

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser };

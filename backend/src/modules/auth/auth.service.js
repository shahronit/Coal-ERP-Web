const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../config/database');
const config = require('../../config');
const { AppError } = require('../../utils/AppError');

const userProfileSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  phone: true,
  username: true,
  department: true,
  designation: true,
  address: true,
  createdAt: true,
  updatedAt: true,
};

const hashPassword = (password) => bcrypt.hash(password, 12);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });
  return { accessToken, refreshToken };
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const login = async (email, password) => {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  const { accessToken, refreshToken } = generateTokens(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt,
    },
  });

  const { passwordHash, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
};

const refresh = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, userId: decoded.userId, revokedAt: null },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Refresh token expired or revoked', 401);
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findFirst({
    where: { id: decoded.userId, deletedAt: null, isActive: true },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) throw new AppError('User not found', 401);

  const tokens = generateTokens(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(tokens.refreshToken),
      userId: user.id,
      expiresAt,
    },
  });

  return { user, ...tokens };
};

const logout = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null, isActive: true },
  });

  if (!user) return { message: 'If account exists, reset link sent' };

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt,
    },
  });

  return {
    message: 'If account exists, reset link sent',
    resetToken: process.env.NODE_ENV !== 'production' ? token : undefined,
  };
};

const resetPassword = async (token, newPassword) => {
  const tokenHash = hashToken(token);
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!resetToken) throw new AppError('Invalid or expired reset token', 400);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { message: 'Password reset successful' };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 400);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { message: 'Password changed successfully' };
};

const getProfile = async (userId) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, isActive: true },
    select: userProfileSelect,
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const updateProfile = async (userId, data) => {
  const normalized = {};
  if (data.name !== undefined) normalized.name = data.name.trim();
  ['phone', 'username', 'department', 'designation', 'address'].forEach((field) => {
    if (data[field] !== undefined) {
      const value = typeof data[field] === 'string' ? data[field].trim() : data[field];
      normalized[field] = value === '' ? null : value;
    }
  });

  if (normalized.username) {
    const duplicate = await prisma.user.findFirst({
      where: { username: normalized.username, id: { not: userId }, deletedAt: null },
    });
    if (duplicate) throw new AppError('Username already taken', 409);
  }

  return prisma.user.update({
    where: { id: userId },
    data: normalized,
    select: userProfileSelect,
  });
};

module.exports = {
  hashPassword,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  userProfileSelect,
};

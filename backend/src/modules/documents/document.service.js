const prisma = require('../../config/database');
const { AppError } = require('../../utils/AppError');
const { paginate } = require('../../utils/pagination');
const { mergeListQuery } = require('../../utils/listQuery');
const {
  uploadFile,
  downloadToTemp,
  deleteFile,
} = require('../../services/storage/storageAdapter');

const list = (query) =>
  paginate('document', {
    ...mergeListQuery(query, { filterKeys: ['entityType', 'entityId'] }),
    searchFields: ['originalName', 'entityType'],
  });

const upload = async (file, data, userId) => {
  const destPath = `uploads/${file.filename}`;
  const stored = await uploadFile(file, destPath);
  return prisma.document.create({
    data: {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      filePath: stored.storagePath || stored.localPath,
      entityType: data.entityType,
      entityId: data.entityId,
      uploadedById: userId,
    },
  });
};

const get = async (id) => {
  const doc = await prisma.document.findFirst({ where: { id, deletedAt: null } });
  if (!doc) throw new AppError('Document not found', 404);
  return doc;
};

const download = async (id) => {
  const doc = await get(id);
  const storagePath = doc.filePath;
  const localPath = await downloadToTemp(storagePath);
  return { ...doc, localPath };
};

const remove = async (id) => {
  const doc = await get(id);
  await deleteFile(doc.filePath);
  return prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });
};

module.exports = { list, upload, get, download, remove };

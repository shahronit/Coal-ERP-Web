const documentService = require('./document.service');
const { sendSuccess } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const result = await documentService.list(req.query);
    sendSuccess(res, result.data, 'Documents retrieved', 200, result.meta);
  } catch (err) { next(err); }
};

const upload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const doc = await documentService.upload(req.file, req.body, req.user.id);
    sendSuccess(res, doc, 'Document uploaded', 201);
  } catch (err) { next(err); }
};

const download = async (req, res, next) => {
  try {
    const doc = await documentService.download(req.params.id);
    res.download(doc.localPath, doc.originalName);
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await documentService.remove(req.params.id);
    sendSuccess(res, null, 'Document deleted');
  } catch (err) { next(err); }
};

module.exports = { list, upload, download, remove };

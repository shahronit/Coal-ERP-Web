const PDFDocument = require('pdfkit');
const { getCompanyProfile } = require('./companyProfile');
const { formatByType } = require('./formatters');
const { sanitizeFileName } = require('./excelRenderer');

const PAGE_MARGIN = 36;

const setDownloadHeaders = (res, filename) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFileName(filename)}.pdf"`);
};

const drawHeader = (doc, title, metadata = {}) => {
  const company = getCompanyProfile();
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#1565c0').text(company.name, { align: 'center' });
  doc.font('Helvetica').fontSize(8).fillColor('#333').text(`${company.address} | ${company.phone} | ${company.email}`, { align: 'center' });
  doc.text(`GSTIN: ${company.gstin}`, { align: 'center' });
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111').text(title, { align: 'center' });
  doc.moveDown(0.4);

  const entries = Object.entries(metadata).filter(([, value]) => value);
  entries.forEach(([key, value]) => {
    doc.font('Helvetica-Bold').fontSize(8).text(`${key}: `, { continued: true });
    doc.font('Helvetica').text(String(value));
  });
  if (entries.length) doc.moveDown(0.6);
};

const getColumnWidths = (columns, availableWidth) => {
  const configured = columns.reduce((sum, column) => sum + (column.pdfWidth || 0), 0);
  if (configured) {
    const scale = availableWidth / configured;
    return columns.map(column => Math.max(44, (column.pdfWidth || 70) * scale));
  }
  return columns.map(() => availableWidth / columns.length);
};

const drawRow = (doc, y, columns, widths, values, options = {}) => {
  const rowHeight = options.height || 24;
  let x = PAGE_MARGIN;
  if (options.fill) {
    doc.rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, rowHeight).fill(options.fill);
  }
  columns.forEach((column, index) => {
    doc
      .rect(x, y, widths[index], rowHeight)
      .strokeColor('#d9e2ef')
      .lineWidth(0.5)
      .stroke();
    doc
      .font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(options.fontSize || 8)
      .fillColor(options.color || '#111')
      .text(values[index], x + 4, y + 7, {
        width: widths[index] - 8,
        align: column.align || (['currency', 'number', 'percent'].includes(column.type) ? 'right' : 'left'),
        ellipsis: true,
      });
    x += widths[index];
  });
  return y + rowHeight;
};

const drawFooter = (doc) => {
  const company = getCompanyProfile();
  const bottom = doc.page.height - 30;
  doc.fontSize(7).fillColor('#666').text(company.footerNote, PAGE_MARGIN, bottom, {
    align: 'left',
    width: doc.page.width - PAGE_MARGIN * 2,
  });
};

const addPageIfNeeded = (doc, y, columns, widths, title, metadata) => {
  if (y < doc.page.height - 80) return y;
  drawFooter(doc);
  doc.addPage();
  drawHeader(doc, title, metadata);
  return drawRow(doc, doc.y, columns, widths, columns.map(c => c.label), {
    bold: true,
    fill: '#e3f2fd',
    color: '#0a2540',
  });
};

const writePDF = (res, { title, columns, rows, metadata, totals, filename }) => {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', bufferPages: true });
  setDownloadHeaders(res, filename || title);
  doc.pipe(res);

  const availableWidth = doc.page.width - PAGE_MARGIN * 2;
  const widths = getColumnWidths(columns, availableWidth);
  drawHeader(doc, title, metadata);

  let y = drawRow(doc, doc.y, columns, widths, columns.map(c => c.label), {
    bold: true,
    fill: '#e3f2fd',
    color: '#0a2540',
  });

  rows.forEach((row, index) => {
    y = addPageIfNeeded(doc, y, columns, widths, title, metadata);
    const values = columns.map(column => formatByType(row[column.key], column.type));
    y = drawRow(doc, y, columns, widths, values, { fill: index % 2 === 0 ? '#ffffff' : '#f8fbff' });
  });

  if (totals && Object.keys(totals).length) {
    y = addPageIfNeeded(doc, y, columns, widths, title, metadata);
    const values = columns.map((column, index) => {
      if (index === 0) return 'Total';
      if (totals[column.key] !== undefined) return formatByType(totals[column.key], column.type);
      return '';
    });
    drawRow(doc, y + 8, columns, widths, values, { bold: true, fill: '#eef5ff' });
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    drawFooter(doc);
    doc.fontSize(7).fillColor('#666').text(`Page ${i + 1} of ${range.count}`, PAGE_MARGIN, doc.page.height - 30, {
      align: 'right',
      width: doc.page.width - PAGE_MARGIN * 2,
    });
  }

  doc.end();
};

module.exports = { writePDF };

const ExcelJS = require('exceljs');
const { getCompanyProfile } = require('./companyProfile');
const { formatByType, toNumber } = require('./formatters');

const sanitizeFileName = (value) =>
  String(value || 'export').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const setDownloadHeaders = (res, filename) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFileName(filename)}.xlsx"`);
};

const autoWidth = (worksheet) => {
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const length = String(cell.value || '').length;
      if (length > maxLength) maxLength = length;
    });
    column.width = Math.min(maxLength + 2, 36);
  });
};

const styleHeaderRow = (row) => {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
  row.alignment = { vertical: 'middle' };
  row.eachCell(cell => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
};

const addTitle = (worksheet, title, metadata = {}, columnCount) => {
  const company = getCompanyProfile();
  const endColumn = Math.max(columnCount, 4);
  worksheet.mergeCells(1, 1, 1, endColumn);
  worksheet.getCell(1, 1).value = company.name;
  worksheet.getCell(1, 1).font = { bold: true, size: 18, color: { argb: 'FF1565C0' } };
  worksheet.getCell(1, 1).alignment = { horizontal: 'center' };

  worksheet.mergeCells(2, 1, 2, endColumn);
  worksheet.getCell(2, 1).value = `${company.address} | ${company.phone} | ${company.email} | GSTIN: ${company.gstin}`;
  worksheet.getCell(2, 1).alignment = { horizontal: 'center' };

  worksheet.mergeCells(4, 1, 4, endColumn);
  worksheet.getCell(4, 1).value = title;
  worksheet.getCell(4, 1).font = { bold: true, size: 15 };
  worksheet.getCell(4, 1).alignment = { horizontal: 'center' };

  let rowIndex = 5;
  Object.entries(metadata).filter(([, value]) => value).forEach(([key, value]) => {
    worksheet.getCell(rowIndex, 1).value = key;
    worksheet.getCell(rowIndex, 1).font = { bold: true };
    worksheet.getCell(rowIndex, 2).value = value;
    rowIndex += 1;
  });

  return rowIndex + 1;
};

const renderWorkbook = ({ title, columns, rows, metadata, totals, sheetName = 'Report' }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TradeCRM Pro';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet(sheetName);
  const startRow = addTitle(worksheet, title, metadata, columns.length);

  const headerRow = worksheet.getRow(startRow);
  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.label;
  });
  styleHeaderRow(headerRow);

  rows.forEach((row, rowIndex) => {
    const excelRow = worksheet.getRow(startRow + rowIndex + 1);
    columns.forEach((column, columnIndex) => {
      const cell = excelRow.getCell(columnIndex + 1);
      const value = row[column.key];
      cell.value = column.type === 'currency' || column.type === 'number' || column.type === 'percent'
        ? (column.type === 'percent' ? toNumber(value) / 100 : toNumber(value))
        : formatByType(value, column.type);
      cell.alignment = { horizontal: column.align || (['currency', 'number', 'percent'].includes(column.type) ? 'right' : 'left') };
      if (column.type === 'currency') cell.numFmt = '"₹"#,##0.00';
      if (column.type === 'number') cell.numFmt = '#,##0.00';
      if (column.type === 'percent') cell.numFmt = '0.00%';
    });
  });

  if (totals && Object.keys(totals).length) {
    const totalRow = worksheet.getRow(startRow + rows.length + 2);
    totalRow.getCell(1).value = 'Total';
    totalRow.font = { bold: true };
    columns.forEach((column, index) => {
      if (totals[column.key] !== undefined) {
        const cell = totalRow.getCell(index + 1);
        cell.value = column.type === 'percent' ? toNumber(totals[column.key]) / 100 : toNumber(totals[column.key]);
        if (column.type === 'currency') cell.numFmt = '"₹"#,##0.00';
      }
    });
  }

  worksheet.views = [{ state: 'frozen', ySplit: startRow }];
  worksheet.autoFilter = {
    from: { row: startRow, column: 1 },
    to: { row: startRow, column: columns.length },
  };
  autoWidth(worksheet);
  return workbook;
};

const writeExcel = async (res, options) => {
  const workbook = renderWorkbook(options);
  setDownloadHeaders(res, options.filename || options.title);
  await workbook.xlsx.write(res);
  res.end();
};

module.exports = { renderWorkbook, writeExcel, sanitizeFileName };

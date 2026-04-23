import * as XLSX from 'xlsx';

type CellValue = string | number | boolean | null | undefined;

export const downloadWorkbook = (
  filename: string,
  sheets: Array<{
    name: string;
    headers: string[];
    rows: CellValue[][];
  }>
) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
    const columnCount = sheet.headers.length;
    worksheet['!cols'] = sheet.headers.map((header, index) => {
      const maxLength = Math.max(
        String(header).length,
        ...sheet.rows.map((row) => String(row[index] ?? '').length)
      );

      return { wch: Math.min(Math.max(maxLength + 2, 12), index === columnCount - 1 ? 36 : 24) };
    });
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  XLSX.writeFile(workbook, filename);
};

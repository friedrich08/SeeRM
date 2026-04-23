export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) => {
  const escapeCell = (value: string | number | null | undefined) => {
    const normalized = String(value ?? '').replace(/"/g, '""');
    return `"${normalized}"`;
  };

  const content = [headers, ...rows].map((row) => row.map(escapeCell).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

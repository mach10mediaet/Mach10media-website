/** RFC-4180-ish CSV serialization with Excel-friendly quoting. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map(row =>
      row
        .map(cell => {
          const value = cell == null ? '' : String(cell);
          return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(',')
    )
    .join('\r\n');
}

/** Triggers a browser download of `rows` as a CSV file (BOM included for Excel). */
export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]): void {
  const blob = new Blob(['\uFEFF' + toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

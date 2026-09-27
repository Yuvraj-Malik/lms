/**
 * Utility to export tabular data to a downloadable CSV file.
 * Handles proper escaping of quotes, commas, and line breaks.
 */
export function exportToCsv(filename, rows, headers) {
  if (!rows || !rows.length) {
    alert("No data available to export.");
    return;
  }

  const columnKeys = headers ? headers.map((h) => h.key) : Object.keys(rows[0]);
  const columnLabels = headers ? headers.map((h) => h.label) : columnKeys;

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = columnLabels.map(escapeCell).join(",");
  const dataLines = rows.map((row) =>
    columnKeys.map((key) => escapeCell(row[key])).join(",")
  );

  const csvContent = [headerLine, ...dataLines].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

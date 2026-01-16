import * as XLSX from "xlsx-js-style";
import dayjs from "dayjs";

export const exportToExcel = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  const headerColor = "4A00E0";
  const stripeColor = "F3F4F6";
  const borderStyle = { style: "thin", color: { rgb: "E5E7EB" } };

  const baseStyle = {
    font: { name: "Calibri", sz: 11 },
    alignment: { vertical: "center", wrapText: true },
    border: {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle,
    },
  };

  const headerStyle = {
    ...baseStyle,
    fill: { fgColor: { rgb: headerColor } },
    font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center" },
  };

  const stripeStyle = {
    ...baseStyle,
    fill: { fgColor: { rgb: stripeColor } },
  };

  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const colWidths: { wch: number }[] = [];

  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 12;

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
      const cell = worksheet[cellAddress];

      if (cell) {
        if (R === 0) {
          cell.s = headerStyle;
        } else {
          cell.s = R % 2 === 0 ? stripeStyle : baseStyle;
        }

        if (cell.v) {
          const cellLength = String(cell.v).length;
          if (cellLength > maxWidth) maxWidth = cellLength;
        }
      }
    }
    colWidths.push({ wch: maxWidth + 2 });
  }

  worksheet["!cols"] = colWidths;

  worksheet["!autofilter"] = { ref: XLSX.utils.encode_range(range) };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  const dateStr = dayjs().format("YYYY-MM-DD");
  XLSX.writeFile(workbook, `${fileName}_${dateStr}.xlsx`);
};

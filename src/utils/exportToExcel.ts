import * as XLSX from "xlsx";
import dayjs from "dayjs";

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  const dateStr = dayjs().format("YYYY-MM-DD");
  XLSX.writeFile(workbook, `${fileName}_${dateStr}.xlsx`);
};

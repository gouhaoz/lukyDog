import dayjs from "dayjs";
import { utils, writeFile } from "xlsx";

export const downloadTable = (tableName, data, columns, type = undefined) => {
  const disableCol = ["operate", "status"];
  const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const wb = utils.book_new();

  let title = `${tableName}(${time}).xlsx`;
  const createSheet = (cols, rows) => {
    const keys = cols
      .filter((c) => c.dataIndex && !disableCol.includes(c.dataIndex))
      .map((c) => c.dataIndex);
    const header = cols
      .filter((c) => c.dataIndex && !disableCol.includes(c.dataIndex))
      .map((c) => c.title);
    const dataRows = rows.map((row) => keys.map((k) => row[k]));
    return utils.aoa_to_sheet([header, ...dataRows]);
  };

  if (!type) {
    const ws = createSheet(columns, data);
    utils.book_append_sheet(wb, ws, "Sheet1");
  } else {
    title = `综合表格(${time}).xlsx`;
    data.forEach((item) => {
      const ws = createSheet(columns, item.data);
      utils.book_append_sheet(wb, ws, item.listName);
    });
  }

  writeFile(wb, title);
};

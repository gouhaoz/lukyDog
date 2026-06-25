const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const XLSX = require("xlsx");
const Database = require("sql.js");
const dayjs = require("dayjs");
const { sum, includes } = require("lodash");
let db;

console.log("\u001b[?1004l");
const { SheetBase } = require("./sheetBase.js");
const { cache } = require("react");
const colorList = [
  "#973b3b",
  "#a8af45",
  "#3b9740",
  "#3b9771",
  "#3b7297",
  "#3b4497",
  "#6e3b97",
  "#973b97",
  "#973b78",
];

ipcMain.handle("file:upload", async (event, fileData) => {
  try {
    const buffer = Buffer.from(fileData.data);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetNameList = workbook.SheetNames;
    SheetBase.sheetData = workbook.Sheets;

    console.log("sheetNameList info:", sheetNameList);
    return sheetNameList;
  } catch (err) {
    console.error(err);
    throw new Error("上传文件出现错误！", err.message);
  }
});

//添加数据列表
ipcMain.handle("table:add", async (event, data) => {
  const { listName, sheetName } = data;
  const worksheet = SheetBase.sheetData[sheetName];

  try {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    console.log("jsonData", jsonData, jsonData.length === 0);

    if (jsonData.length === 0) {
      throw new Error(`[${sheetName}]工作表无数据，不能导入空的表`);
    }
    const listFormat = ["code", "name", "point"];

    const initData = jsonData.map((item, index) => {
      const rowValue = Object.values(item);
      const defaultKey =
        dayjs().valueOf().toString(32) + (index * jsonData.length).toString(32);
      let newItem = {};
      for (let i = 0; i < rowValue.length; i++) {
        const defaultValueList = [defaultKey, "无名氏", 0];
        newItem[listFormat[i]] = rowValue[i];
        if (rowValue[i].length === 0) {
          newItem[listFormat[i]] = defaultValueList[i];
        }
      }
      newItem["color"] = colorList[index % colorList.length];
      newItem["key"] = defaultKey;
      return newItem;
    });

    const isInclude = SheetBase.state.data.some(
      (item) => item.listName === listName
    );

    if (isInclude) {
      throw new Error(`[${listName}]工作表已存在，无法重复添加！`);
    }

    SheetBase.state.data.push({
      listName: listName,
      data: initData,
      time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    });
    console.log("处理后数据：", SheetBase.state.data);
  } catch (err) {
    throw new Error(err.message);
  }
});

// 读取后端内存数据
ipcMain.handle("data:readData", async () => {
  return SheetBase.state;
});

ipcMain.handle("data:rangeTabName", async (event, name) => {
  const { tableName, newName } = name;
  const dataIndex = SheetBase.state.data.findIndex(
    (item) => item.listName === tableName
  );
  SheetBase.state.data[dataIndex].listName = newName;
});

ipcMain.handle("data:rangeTabItem", async (event, obj) => {
  const { tableName, key, formObj } = obj;
  const { code, name, point } = formObj;
  const dataIndex = SheetBase.state.data.findIndex(
    (item) => item.listName === tableName
  );
  SheetBase.state.data[dataIndex].data = SheetBase.state.data[
    dataIndex
  ].data.map((item) => {
    if (item.key === key) {
      item.code = code;
      item.name = name;
      item.point = point;
    }
    return item;
  });
});

ipcMain.handle("data:rangeaddItem", async (event, obj) => {
  const { tableName, formObj } = obj;
  const { code, name, point } = formObj;
  const dataIndex = SheetBase.state.data.findIndex(
    (item) => item.listName === tableName
  );
  const defaultKey =
    dayjs().valueOf().toString(32) +
    (SheetBase.state.data.length - 1 * SheetBase.state.data.length).toString(
      32
    );
  console.log("item元素：", SheetBase.state.data[dataIndex]);

  const newObj = {
    code: code,
    name: name,
    point: point,
    color:
      colorList[
        (SheetBase.state.data[dataIndex].data.length + 1) % colorList.length
      ],
    key: defaultKey,
  };
  SheetBase.state.data[dataIndex].data.push(newObj);
  return newObj;
});

ipcMain.handle("data:delTab", async (event, tableName) => {
  const dataIndex = SheetBase.state.data.findIndex(
    (item) => item.listName === tableName
  );
  SheetBase.state.data.splice(dataIndex, 1);
});

ipcMain.handle("data:delTabItem", async (event, keys) => {
  const { tabName, itemKey } = keys;
  const dataIndex = SheetBase.state.data.findIndex(
    (item) => item.listName === tabName
  );
  SheetBase.state.data[dataIndex].data = SheetBase.state.data[
    dataIndex
  ].data.filter((item) => item.key !== itemKey);
});

ipcMain.handle("block:rangeStatus", async (event, key) => {
  const dataIndex = SheetBase.state.blockList.findIndex((item) => item === key);

  if (dataIndex === -1) {
    SheetBase.state.blockList.push(key);
    return SheetBase.state.blockList;
  }
  SheetBase.state.blockList.splice(dataIndex, 1);
  return SheetBase.state.blockList;
});

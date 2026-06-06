const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const XLSX = require("xlsx");
const { SheetBase } = require("./services/sheetBase.js");
const {
  initDatabase,
  saveDataToDB,
  loadDataFromDB,
} = require("./services/dbService.js");
const dayjs = require("dayjs");
const { sum } = require("lodash");
const fs = require("node:fs");

require("./services/handleData.js");
require("./services/rand.js");

console.log("\u001b[?1004l");

const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("✅ 创建数据目录成功");
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    icon: "public/logo.svg",
    webPreferences: {
      preload: path.join(__dirname, "rendererProcess.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:8000");

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const getOrigin = (urlStr) => {
    try {
      const url = new URL(urlStr);
      return url.origin;
    } catch {
      return null;
    }
  };

  win.webContents.setWindowOpenHandler(({ url }) => {
    const currentOrigin = getOrigin(win.webContents.getURL());
    const targetOrigin = getOrigin(url);
    if (targetOrigin && currentOrigin !== targetOrigin) {
      shell.openExternal(url);
    } else {
    }
    return { action: "deny" };
  });
};

app.on("before-quit", async (event) => {
  event.preventDefault();
  try {
    console.log("🔄 正在保存数据...");
    const data = SheetBase.state.data;
    const blockList = SheetBase.state.blockList;
    const settings = {
      lowChanceMode: SheetBase.state.lowChanceMode,
      pointRuleList: SheetBase.state.pointRuleList,
    };

    await saveDataToDB(data, blockList, settings);

    console.log("✅ 程序即将退出");
    setTimeout(() => {
      app.exit();
    }, 500);
  } catch (err) {
    console.error("❌ 数据保存失败", err);
    app.exit();
  }
});

app.whenReady().then(async () => {
  console.log("🔄 正在初始化数据库...");
  await initDatabase();

  console.log("🔄 正在加载数据...");
  const savedData = await loadDataFromDB();
  SheetBase.state.data = savedData.data;
  SheetBase.state.blockList = savedData.blockList;
  SheetBase.state.lowChanceMode = savedData.lowChanceMode;
  SheetBase.state.pointRuleList = savedData.pointRuleList;

  createWindow();
});

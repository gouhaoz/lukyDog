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

// 根据环境获取数据目录
const isPackaged = app.isPackaged;
const dataDir = isPackaged
  ? path.join(app.getPath("userData"), "data")
  : path.join(__dirname, "../data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("✅ 创建数据目录成功:", dataDir);
}

const createWindow = async () => {
  const isPackaged = app.isPackaged;

  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    icon: isPackaged
      ? path.join(process.resourcesPath, "public/logo.svg")
      : path.join(__dirname, "../public/logo.svg"),
    webPreferences: {
      preload: path.join(__dirname, "rendererProcess.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 加载对应的 URL 或文件
  if (isPackaged) {
    const appPath = app.getAppPath();
    console.log("🔍 app.getAppPath():", appPath);
    console.log("🔍 app.isPackaged:", app.isPackaged);

    const indexPath = path.join(appPath, "dist", "index.html");
    console.log("🔍 index.html 路径:", indexPath);

    // 检查文件是否存在
    if (fs.existsSync(indexPath)) {
      console.log("✅ index.html 存在");
    } else {
      console.error("❌ index.html 不存在!");
    }

    const indexUrl = `file:///${indexPath.replace(/\\/g, "/")}`;
    console.log("🔍 index.html URL:", indexUrl);

    await win.loadURL(indexUrl);
    console.log("✅ 页面加载完成");
  } else {
    // 开发环境加载本地服务器
    win.loadURL("http://localhost:8000");
  }

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

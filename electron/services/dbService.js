const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

let db = null;

// 获取数据目录（开发环境使用项目目录，生产环境使用用户数据目录）
const getUserDataDir = () => {
  if (app.isPackaged) {
    // 生产环境：使用用户数据目录
    return path.join(app.getPath("userData"), "data");
  } else {
    // 开发环境：使用项目根目录下的 data 文件夹
    return path.join(__dirname, "../../data");
  }
};

async function initDatabase() {
  try {
    const isPackaged = app.isPackaged;
    let wasmPath;

    if (isPackaged) {
      // 打包后，wasm 文件在 asar 包内
      wasmPath = path.join(
        __dirname,
        "../../node_modules/sql.js/dist/sql-wasm.wasm"
      );
    } else {
      // 开发环境
      wasmPath = path.join(
        __dirname,
        "../../node_modules/sql.js/dist/sql-wasm.wasm"
      );
    }

    console.log("🔍 wasm 文件路径:", wasmPath);

    if (!fs.existsSync(wasmPath)) {
      console.error("❌ wasm 文件不存在:", wasmPath);
      throw new Error("sql-wasm.wasm 文件不存在");
    }

    const SQL = await initSqlJs({
      locateFile: (filename) => {
        return path.join(path.dirname(wasmPath), filename);
      },
    });
    db = new SQL.Database();
    createTables();
    console.log("✅ 数据库初始化成功");
  } catch (err) {
    console.error("❌ 数据库加载失败", err);
  }
}

function createTables() {
  if (!db) return;

  db.run(`
    CREATE TABLE IF NOT EXISTS sheet_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_name TEXT NOT NULL UNIQUE,
      data TEXT NOT NULL,
      created_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS block_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      low_chance_mode INTEGER DEFAULT 0,
      point_rule_list TEXT DEFAULT '[]'
    )
  `);

  console.log("✅ 数据库表创建成功");
}

async function saveDataToDB(sheetData, blockList, settings = {}) {
  if (!db) {
    console.log("⚠️ 数据库未初始化");
    return;
  }

  try {
    db.run("BEGIN TRANSACTION");

    db.run("DELETE FROM sheet_data");
    db.run("DELETE FROM block_list");

    for (const item of sheetData) {
      db.run(
        "INSERT OR REPLACE INTO sheet_data (list_name, data, created_at) VALUES (?, ?, ?)",
        [item.listName, JSON.stringify(item.data), item.time]
      );
    }

    for (const key of blockList) {
      db.run("INSERT OR REPLACE INTO block_list (key) VALUES (?)", [key]);
    }

    const lowChanceMode = settings.lowChanceMode ? 1 : 0;
    const pointRuleList = JSON.stringify(settings.pointRuleList || []);

    db.run("DELETE FROM settings");
    db.run(
      "INSERT INTO settings (id, low_chance_mode, point_rule_list) VALUES (1, ?, ?)",
      [lowChanceMode, pointRuleList]
    );

    db.run("COMMIT");
    console.log("✅ 数据保存成功");

    const data = db.export();
    const dataDir = getUserDataDir();
    const dbPath = path.join(dataDir, "database.sqlite");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(dbPath, Buffer.from(data));
    console.log("✅ 数据库文件已保存到:", dbPath);
  } catch (err) {
    db.run("ROLLBACK");
    console.error("❌ 数据保存失败", err);
  }
}

async function loadDataFromDB() {
  try {
    const dataDir = getUserDataDir();
    const dbPath = path.join(dataDir, "database.sqlite");
    const wasmPath = path.join(
      __dirname,
      "../../node_modules/sql.js/dist/sql-wasm.wasm"
    );

    if (!fs.existsSync(dbPath)) {
      console.log("⚠️ 数据库文件不存在，返回空数据:", dbPath);
      return {
        data: [],
        blockList: [],
        lowChanceMode: false,
        pointRuleList: [],
      };
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const SQL = await initSqlJs({
      locateFile: (filename) => {
        return path.join(path.dirname(wasmPath), filename);
      },
    });
    db = new SQL.Database(new Uint8Array(fileBuffer));
    console.log("✅ 从文件加载数据库成功:", dbPath);

    createTables();

    const sheetResult = db.exec("SELECT * FROM sheet_data");
    const data =
      sheetResult.length > 0
        ? sheetResult[0].values.map((row) => ({
            listName: row[1],
            data: JSON.parse(row[2]),
            time: row[3],
          }))
        : [];

    const blockResult = db.exec("SELECT * FROM block_list");
    const blockList =
      blockResult.length > 0 ? blockResult[0].values.map((row) => row[1]) : [];

    let lowChanceMode = false;
    let pointRuleList = [];

    try {
      const settingsResult = db.exec("SELECT * FROM settings WHERE id = 1");
      if (settingsResult.length > 0 && settingsResult[0].values.length > 0) {
        lowChanceMode = settingsResult[0].values[0][1] === 1;
        pointRuleList = JSON.parse(settingsResult[0].values[0][2] || "[]");
      }
    } catch (e) {
      console.log("⚠️ settings 表查询失败，使用默认值");
    }

    console.log(
      "✅ 数据加载成功，共",
      data.length,
      "个数据表，",
      blockList.length,
      "个黑名单项"
    );
    return { data, blockList, lowChanceMode, pointRuleList };
  } catch (err) {
    console.error("❌ 数据加载失败", err);
    return { data: [], blockList: [], lowChanceMode: false, pointRuleList: [] };
  }
}

module.exports = {
  initDatabase,
  saveDataToDB,
  loadDataFromDB,
  getDB: () => db,
};

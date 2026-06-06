const { SheetDatabase } = require("./dataProcessing.js");

// 创建唯一的 SheetBase 实例
const SheetBase = new SheetDatabase();

module.exports = { SheetBase };

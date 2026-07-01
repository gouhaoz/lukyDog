const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 文件上传
  readFile: (fileData) => {
    return ipcRenderer.invoke("file:upload", fileData);
  },

  //添加文件入库
  addTableData: (listName, sheetName) => {
    return ipcRenderer.invoke("table:add", { listName, sheetName });
  },

  // 获取导入数据
  readData: () => {
    return ipcRenderer.invoke("data:readData");
  },

  // 修改操作
  rangetabName: (tableName, newName) => {
    return ipcRenderer.invoke("data:rangeTabName", { tableName, newName });
  },

  rangetabItem: (tableName, key, formObj) => {
    return ipcRenderer.invoke("data:rangeTabItem", { tableName, key, formObj });
  },

  rangeaddItem: (tableName, formObj) => {
    return ipcRenderer.invoke("data:rangeaddItem", { tableName, formObj });
  },

  // 删除操作
  delTab: (tableName) => {
    return ipcRenderer.invoke("data:delTab", tableName);
  },

  delTabItem: (tabName, itemKey) => {
    return ipcRenderer.invoke("data:delTabItem", { tabName, itemKey });
  },

  //改变状态
  rangeStatus: (itemKey) => {
    return ipcRenderer.invoke("block:rangeStatus", itemKey);
  },

  //改变抽奖模式
  rangeMode: (mode) => {
    return ipcRenderer.invoke("mode:rangeMode", mode);
  },

  //改变积分规则
  rangePointRule: (ruleList) => {
    return ipcRenderer.invoke("pointRule:rangePointRule", ruleList);
  },

  //随机抽奖
  randData: (tabNameList, number) => {
    return ipcRenderer.invoke("rand:data", { tabNameList, number });
  },

  //确定抽奖结果
  confirmData: (winnerList) => {
    return ipcRenderer.invoke("confirm:data", winnerList);
  },
});

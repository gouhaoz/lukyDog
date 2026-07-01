const { ipcMain } = require("electron");
const dayjs = require("dayjs");
const { SheetBase } = require("./sheetBase.js");

let oldTabList = [];
let cacheList = [];

const isDeepEqual = (a, b) => {
  const str1 = a.join(",");
  const str2 = b.join(",");
  return str1 === str2;
};

ipcMain.handle("rand:data", async (event, objData) => {
  const winnerList = [];
  const { tabNameList, number } = objData;
  const mode = SheetBase.state.lowChanceMode;
  const selectedTables = SheetBase.state.data.filter((item) =>
    tabNameList.includes(item.listName)
  );
  let randList = selectedTables.flatMap((item) => item.data);
  if (
    !isDeepEqual(oldTabList, tabNameList) ||
    cacheList.length >= randList.length
  ) {
    cacheList = [];
  }
  console.log(
    "抽取数据：",
    isDeepEqual(oldTabList, tabNameList),
    oldTabList,
    tabNameList
  );
  randList = randList.filter(
    (item) => !SheetBase.state.blockList.includes(item.key)
  );

  const onRand = () => {
    const randIndex = Math.floor(Math.random() * randList.length);
    if (mode && cacheList.includes(randList[randIndex].key)) {
      onRand();
    } else {
      winnerList.push({ ...randList[randIndex] });
      if (mode && randList[randIndex]) {
        cacheList.push(randList[randIndex].key);
        if (cacheList.length >= randList.length) {
          cacheList = [];
        }
      }
    }
  };

  for (let i = 0; i < number; i++) {
    onRand();
  }
  oldTabList = tabNameList;

  return winnerList;
});

ipcMain.handle("confirm:data", async (event, winnerList) => {
  for (let item of winnerList) {
    for (let i = 0; i < SheetBase.state.data.length; i++) {
      const index = SheetBase.state.data[i].data.findIndex(
        (item2) => item2.key === item.key
      );
      if (index !== -1) {
        const newValue = item.interimScore ? Number(item.interimScore) : 0;
        const oldPoint = Number(SheetBase.state.data[i].data[index].point);
        SheetBase.state.data[i].data[index].point = oldPoint + newValue;
      }
    }
  }
});

ipcMain.handle("pointRule:rangePointRule", async (event, ruleList) => {
  SheetBase.state.pointRuleList = ruleList;
});

ipcMain.handle("mode:rangeMode", async (event, mode) => {
  SheetBase.state.lowChanceMode = mode;
});

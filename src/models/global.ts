// 全局共享数据示例
import { sum } from "lodash";
import { useMemo, useState } from "react";

const useUser = () => {
  const [fromData, setFromData] = useState<any[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [poolData, setPoolData] = useState<any[]>([]);

  const fromNames = useMemo(() => {
    const list = fromData.map((item) => {
      const itemPointList = item.data.map((item) => Number(item.point));
      return {
        value: item.listName,
        population: item.data.length,
        totalPoints: sum(itemPointList),
        time: item.time,
      };
    });
    return list;
  }, [fromData]);

  return {
    fromData,
    setFromData,
    fromNames,
    excelData,
    setExcelData,
    poolData,
    setPoolData,
  };
};

export default useUser;

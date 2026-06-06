import { Image } from "antd";
import React from "react";
import style from "./index.less";

const SetScore: React.FC = () => {
  return (
    <>
      <div className={style.excelItem}>
        <Image
          style={{ width: "80px", height: "80px" }}
          preview={false}
          src="/img/PC-Excel.png"
        ></Image>
        <p>xxxxxx</p>
        <div title="删除" className={style.close}>
          ✖
        </div>
      </div>
    </>
  );
};

export default SetScore;

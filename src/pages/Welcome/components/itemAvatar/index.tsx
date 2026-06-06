import { CheckCard } from "@ant-design/pro-components";
import { Avatar, Button, InputNumber, Popover, Radio } from "antd";
import { debounce } from "lodash";
import React, { useEffect, useState } from "react";
import style from "./index.less";

interface AvatarType {
  item: any;
  points: any[];
  onRangePoint: (index: number, value: number) => void;
  index: number;
}

const ItemAvatar: React.FC<AvatarType> = ({
  item,
  points,
  onRangePoint,
  index,
}) => {
  const [isRange, setIsRange] = useState<boolean>(false);

  useEffect(() => {
    if (points.length > 0) {
      setIsRange(true);
    }
    return () => {
      setIsRange(false);
    };
  }, [points]);

  const onChange: any = debounce((value) => {
    console.log("分数改变：", value);

    onRangePoint(index, value);
  }, 300);

  const handleRadioChange = (e: any) => {
    const value = e.target.value;
    onChange(value);
  };

  const sharedProps = {
    mode: "spinner" as const,
    // min: 1,
    // max: sum(excelData.map((item) => item.population)),
    onChange,
    style: { width: 150 },
  };

  const poverContent = () => {
    return (
      <>
        {!isRange && (
          <InputNumber {...sharedProps} variant="filled" placeholder="Filled" />
        )}
        {isRange && (
          <>
            <Radio.Group
              style={{ marginTop: "10px" }}
              onChange={handleRadioChange}
            >
              {points.map((point, index) => (
                <Radio.Button key={point.key} value={point.value}>
                  {point.value}
                </Radio.Button>
              ))}
            </Radio.Group>
          </>
        )}
        &nbsp; &nbsp;
        {points.length > 0 && (
          <Button
            type="primary"
            onClick={() => {
              setIsRange(!isRange);
              onRangePoint(index, undefined);
            }}
          >
            {isRange ? "切换成输入" : "切换成单选"}
          </Button>
        )}
      </>
    );
  };

  const personContent = () => {
    return (
      <div>
        <div>
          姓名：<span style={{ color: "#2b99e2" }}>{item.name}</span>
        </div>
        <div>
          编号：<span style={{ color: "#2b99e2" }}>{item.code}</span>
        </div>
        <div>
          打分：
          <span style={{ color: "#2b99e2" }}>{item.interimScore || "--"}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Popover
        content={poverContent(points)}
        title={`${item.name}的打分`}
        trigger="click"
      >
        <div
          title={`姓名：${item.name} \n编号：${item.code}`}
          className={style.personCard}
        >
          <CheckCard
            title={
              <div className={style.avatarImg}>
                <Avatar
                  size={16}
                  style={{
                    backgroundColor: item.color,
                    width: "60px",
                    height: "60px",
                  }}
                >
                  {item.name.substring(item.name.length - 2)}
                </Avatar>
              </div>
            }
            style={{
              width: "100%",
              boxShadow: "0 0 5px 2px rgba(170, 170, 170, 0.3)",
            }}
            description={personContent()}
            value={index}
          />
        </div>
      </Popover>
    </>
  );
};

export default ItemAvatar;

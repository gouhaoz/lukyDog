import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row } from "antd";
import React from "react";
import style from "./index.less";

const CustomSettingContent: React.FC = ({
  ruleList,
  addRule,
  delRule,
  pointChange,
  closeSetting,
}) => {
  return (
    <>
      <div
        style={{
          // padding: '16px',
          borderTop: "1px solid #e8e8e8",
          marginTop: 10,
        }}
      >
        <div>
          <h3 style={{ padding: "10px 0px" }}>分数规则设置</h3>
          <div>
            <div>
              {ruleList.map((item, index) => {
                return (
                  <div className={style.ruleList} key={item.key}>
                    <h4>规则{index + 1}</h4>
                    <Row>
                      {/* <Col span={3}><PlusCircleOutlined onClick={() => addRule()}/></Col> */}
                      <Col span={18}>
                        <Input
                          value={item.value}
                          onChange={(e) =>
                            pointChange(item.key, e.target.value)
                          }
                          placeholder="请输入分数："
                          type="number"
                        />
                      </Col>
                      <Col span={3}>
                        <MinusCircleOutlined
                          title="删除"
                          onClick={() => delRule(item.key)}
                        />
                      </Col>
                    </Row>
                    <br></br>
                  </div>
                );
              })}

              <Row>
                <Col span={2} style={{ fontSize: "20px" }}>
                  <PlusCircleOutlined onClick={() => addRule()} />
                </Col>
                <Col
                  span={22}
                  style={{ alignItems: "center", display: "flex" }}
                >
                  <span style={{ color: "#808080" }}>
                    &nbsp;&nbsp;点击加号添加分数规则
                  </span>
                </Col>
              </Row>
            </div>
          </div>
        </div>
        <br></br>
        <Button onClick={closeSetting}>关闭设置</Button>
      </div>
    </>
  );
};

export default CustomSettingContent;

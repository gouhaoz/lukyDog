import {
  CloseCircleOutlined,
  CompassOutlined,
  GithubOutlined,
  ImportOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  CheckCard,
  PageHeader,
  SettingDrawer,
} from "@ant-design/pro-components";
import { useModel, useNavigate } from "@umijs/max";
import { useUpdateEffect } from "ahooks";
import type { InputNumberProps } from "antd";
import {
  Button,
  Card,
  Col,
  Empty,
  Image,
  InputNumber,
  Row,
  Select,
  Table,
  Tag,
  message,
} from "antd";
import { debounce, sum } from "lodash";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ColumnSearchProps } from "../services/searchProps";
import CustomSettingContent from "./components/CustomSettingContent";
import GuideModal from "./components/guide";
import ImportModal from "./components/importModal";
import ItemAvatar from "./components/itemAvatar";
import style from "./index.less";

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  const { initialState, setInitialState } = useModel("@@initialState");
  const [ruleList, setRuleList] = useState<any[]>([]);
  const [xlsxList, setXlsxList] = useState<any[]>([]);
  const [isLowChance, setIsLowChance] = useState<boolean>(false);
  const [cardSelected, setCardSelected] = useState<number[]>([]);

  // 抽奖数量
  const [randNumber, setRandNumber] = useState<number>(0);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const {
    fromData,
    setFromData,
    fromNames,
    excelData,
    setExcelData,
    poolData,
    setPoolData,
  } = useModel("global") as any;
  //弹窗状态
  const [modalStatus, setModalStatus] = useState({
    Excel: false,
    Score: false,
    Guide: false,
  });

  const getXlsxList = async () => {
    const resData = await window.electronAPI.readData();
    setFromData(resData.data);
    // console.log('接口信息：',resData);
    setIsLowChance(resData.lowChanceMode);
    setRuleList(resData.pointRuleList);
    console.log("打印信息：", resData);
  };

  useEffect(() => {
    setXlsxList(fromNames);
  }, [fromNames]);

  useEffect(() => {
    getXlsxList();
  }, []);

  // 抽奖列表改变
  const reportChange = (event: any) => {
    console.log("已选数据：", event);
    const excelList = xlsxList.filter((item) => event.includes(item.value));
    setExcelData(excelList);
  };

  const onCancel = (value: string) => {
    setExcelData((pre) => pre.filter((item) => item.value != value));
  };

  //---------------------------------

  const onChange: InputNumberProps["onChange"] = debounce((value) => {
    console.log("changed", value, "\n数据：", excelData);
    setRandNumber(value);
  }, 300);

  const onRangePoint = (index: number, value: number | undefined) => {
    // poolData 中更新对应项的 totalPoints 字段
    // const newDataList = poolData.map((item) => item.key==key? {...item,interimScore:value} : item)
    const newDataList = poolData;
    newDataList[index].interimScore = value;
    setPoolData(newDataList);
    if (value) {
      setCardSelected((pre) => [...pre, index]);
    } else {
      setCardSelected((pre) => pre.filter((item) => item != index));
    }
  };

  const sharedProps = {
    mode: "spinner" as const,
    min: 1,
    max: sum(excelData.map((item) => item.population)),
    onChange,
    style: { width: 150 },
  };

  const columns = [
    {
      title: "列表名",
      dataIndex: "value",
      width: "25%",
      ...ColumnSearchProps("value"),
    },
    {
      title: "人数",
      dataIndex: "population",
      render: (text: number) => {
        const value = text ? text : 0;
        return value;
      },
    },
    {
      title: "总分",
      dataIndex: "totalPoints",
      render: (text: number) => {
        const value = text ? text : 0;
        return value;
      },
    },
  ];

  const tagRender = (props) => {
    const { label, closable, onClose } = props;
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };
    return (
      <Tag
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{ marginInlineEnd: 4 }}
      >
        {label}
      </Tag>
    );
  };

  //对话框逻辑
  const openModal = (value: string) => {
    const obj = { ...modalStatus };
    obj[value] = true;
    setModalStatus(obj);
  };

  const onClose = () => {
    const obj = { ...modalStatus };
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = false;
      }
    }
    setModalStatus(obj);
  };

  const onVisitWeb = () => {
    window.open("https://github.com/gouhaoz/lukyDog");
  };

  const onChance = debounce(async () => {
    setIsLowChance(!isLowChance);
    await window.electronAPI.rangeMode(!isLowChance);
  }, 200);

  // const manageTable = () => {
  //   location.href='/tableList'
  // }

  // 开始抽奖
  const startDraw = async () => {
    // excelData randNumber isLowChance

    try {
      if (excelData.length <= 0) {
        message.warning("请先选择要抽奖的列表！");
        return;
      }
      if (randNumber <= 0) {
        message.warning("请先设置抽奖数量！");
        return;
      }

      setIsDraw(true);
      const nameList = excelData.map((item) => item.value);
      const resData = await window.electronAPI.randData(nameList, randNumber);
      console.log(
        "接口信息：",
        resData,
        "\n传入数据：",
        nameList,
        randNumber,
        isLowChance
      );

      // 制作抽奖动画
      const time = 1000 / resData.length;

      setPoolData([resData[0]]);
      const Timing = setInterval(() => {
        setPoolData((pre) => {
          const nextIndex = pre.length;
          if (nextIndex >= resData.length) {
            clearInterval(Timing);
            return pre;
          }
          return [...pre, resData[nextIndex]];
        });
      }, time);
      console.log("抽取数据：", poolData);

      setTimeout(() => {
        setIsDraw(false);
      }, 1000);
    } catch (err) {
      message.error("抽奖失败！出现错误：", err);
      return;
    }
  };

  const onDataConfirm = async () => {
    try {
      // const selectList = uniq(cardSelected)
      const selectItemList = cardSelected.map((item) => poolData[item]);
      await window.electronAPI.confirmData(selectItemList);
      setPoolData([]);
      setCardSelected([]);
    } catch (err) {
      message.error("计算出现错误：", err);
      return;
    }
  };

  // 自定义配置
  const closeSetting = () => {
    const obj = { ...modalStatus };
    obj["Score"] = false;
    setModalStatus(obj);
  };

  const addRule = debounce(() => {
    const newRule = [...ruleList];
    if (newRule.length >= 10) {
      message.warning("最多可添加10条分数规则，已超出限制！");
      return;
    }
    const id = Date.now() + Math.random().toString(36).slice(2, 9);
    newRule.push({ key: id, value: "0" });
    setRuleList(newRule);
  }, 200);

  const delRule = (id) => {
    setRuleList((prev) => prev.filter((item) => item.key !== id));
  };

  const pointChange = (id, value) => {
    setRuleList((prev) =>
      prev.map((item) => (item.key === id ? { ...item, value } : item))
    );
  };

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  useEffect(() => {
    setTimeout(() => {
      const container = document.querySelector(
        ".ant-pro-setting-drawer-drawer-content"
      );
      setPortalContainer(container as HTMLElement);
    }, 0);
  }, [modalStatus.Score]);

  const upRuleList = async () => {
    await window.electronAPI.rangePointRule(ruleList);
  };

  useUpdateEffect(() => {
    upRuleList();
  }, [ruleList]);

  // const excelData = [...new Array(20)].map((item,index) => {
  //   return {
  //     listName:`表7657uttryr${index+1}`,
  //     population:41,
  //     totalPoints:111
  //   }
  // })

  return (
    <>
      {/* 导入文件弹窗 */}
      <ImportModal
        modalStatus={modalStatus}
        onClose={onClose}
        getXlsxList={getXlsxList}
      ></ImportModal>
      <SettingDrawer
        enableDarkTheme
        themeOnly={true}
        collapse={modalStatus["Score"]}
        onCollapseChange={() => {
          const obj = { ...modalStatus };
          obj["Score"] = false;
          setModalStatus(obj);
        }}
        onSettingChange={(settings) => {
          setInitialState((pre) => ({ ...pre, settings }));
          closeSetting();
        }}
      ></SettingDrawer>

      {/* SettingDrawer组件没有官方渠道添加自定义配置，被迫放在外部用dom添加 */}
      {portalContainer &&
        createPortal(
          <CustomSettingContent
            ruleList={ruleList}
            addRule={addRule}
            delRule={delRule}
            pointChange={pointChange}
            closeSetting={closeSetting}
          />,
          portalContainer
        )}

      <GuideModal modalStatus={modalStatus} onClose={onClose}></GuideModal>

      <PageHeader style={{ paddingInline: 0, padding: 0 }}>
        <div className={style.buttonControl}>
          <div>
            <Button
              type="primary"
              title="导入excel列表名单"
              onClick={() => openModal("Excel")}
            >
              <ImportOutlined />
              导入表格(excel)
            </Button>
            {/* <Button type="primary" title='设置导入表单列表' onClick={manageTable} ><UnorderedListOutlined />管理导入表单</Button> */}
            <Button
              type="primary"
              title="设置导入表单列表"
              onClick={() => navigate("/tableList")}
            >
              <UnorderedListOutlined />
              管理导入表单
            </Button>
            <Button
              type="primary"
              title="设置打分规则"
              onClick={() => openModal("Score")}
            >
              <SettingOutlined />
              应用设置
            </Button>
          </div>
          <Button type="primary" onClick={() => openModal("Guide")}>
            <CompassOutlined />
            查看使用指南
          </Button>
        </div>
      </PageHeader>

      <Row justify="space-between" gutter={[16, 16]}>
        <Col md={8} sm={24} xs={24}>
          <Card className={style.area}>
            <div>
              <Card className={style.productPitch}>
                <Row style={{ width: "100%" }}>
                  <Col md={18} sm={24} xs={24}>
                    <div
                      style={{
                        flexDirection: "row",
                        display: "flex",
                        float: "left",
                      }}
                    >
                      <Image
                        preview={false}
                        width={"5em"}
                        src="./icons/logo.png"
                      ></Image>
                      <div className={style.headerTitle}>
                        <h3>Lucky Dog(幸运小狗)</h3>
                        <span>开箱即用的抽奖程序！</span>
                      </div>
                    </div>
                  </Col>
                  <Col md={6} sm={24} xs={24}>
                    <div>
                      <Button
                        style={{ width: "100%" }}
                        type="primary"
                        onClick={onVisitWeb}
                      >
                        <GithubOutlined />
                        visit GitHub
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>

            <div>
              <p>选择数据来源：</p>
              <div>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  options={xlsxList}
                  tagRender={tagRender}
                  placeholder="请选择--"
                  onChange={reportChange}
                  value={excelData}
                />
              </div>

              <Table
                columns={columns}
                dataSource={excelData}
                className={style.excelContent}
                rowKey={"value"}
                rowSelection={{
                  columnWidth: "25%",
                  // columnTitle: '取消选中',
                  columnTitle: () => {
                    return (
                      <div>
                        <Button
                          title="清空所有选中状态"
                          onClick={() => setExcelData([])}
                        >
                          清空所有
                        </Button>
                      </div>
                    );
                  },
                  renderCell: (checked, _record, index) => {
                    return (
                      <div>
                        <Button
                          onClick={() => onCancel(_record.value)}
                          color="danger"
                          variant="solid"
                        >
                          <CloseCircleOutlined />
                          取消
                        </Button>
                      </div>
                    );
                  },
                }}
                style={{
                  height: "40vh",
                }}
                scroll={{
                  y: "30vh",
                }}
              ></Table>
            </div>

            <div className={style.extractNum}>
              <div>
                <p>抽取数量：</p>
              </div>
              <div>
                <InputNumber
                  {...sharedProps}
                  variant="filled"
                  placeholder="Filled"
                />
              </div>
            </div>
          </Card>
        </Col>

        <Col md={16} sm={24} xs={24}>
          <Card className={style.area}>
            <div>
              <p>
                中奖池：<span>（点击中奖人可打分）</span>
              </p>
            </div>

            <div>
              <CheckCard.Group multiple value={cardSelected}>
                <Card className={style.randContent}>
                  {poolData.length !== 0 ? (
                    poolData.map((item, index) => {
                      return (
                        <ItemAvatar
                          index={index}
                          points={ruleList}
                          onRangePoint={onRangePoint}
                          key={`${index}_${item.key}`}
                          item={item}
                        ></ItemAvatar>
                      );
                    })
                  ) : (
                    <Empty />
                  )}
                </Card>
              </CheckCard.Group>
            </div>

            <div>
              <CheckCard.Group
                style={{ marginTop: "20px" }}
                value={isLowChance}
                onChange={onChance}
              >
                <CheckCard
                  className={style.lowChance}
                  title={
                    isLowChance ? "低概率模式（开启）" : "低概率模式（关闭）"
                  }
                  description="减少每次抽取的数据的相同概率"
                  value={true}
                />
              </CheckCard.Group>
            </div>
            <br></br>
            <div className={style.buttonGroup}>
              {poolData.length > 0 ? (
                <Button
                  disabled={isDraw}
                  className={isDraw ? style.disabled_confirm : ""}
                  type="primary"
                  onClick={onDataConfirm}
                >
                  确定结果
                </Button>
              ) : (
                <Button type="primary" onClick={startDraw}>
                  开始抽奖
                </Button>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Welcome;

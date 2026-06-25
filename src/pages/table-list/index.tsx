import {
  DownloadOutlined,
  ImportOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { Link, useModel } from "@umijs/max";
import { useUpdateEffect } from "ahooks";
import {
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Table,
} from "antd";
import { produce } from "immer";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ColumnSearchProps } from "../services/searchProps";
import ImportModal from "../Welcome/components/importModal";
import style from "./index.less";
import { downloadTable } from "./services";

const TableList: React.FC = () => {
  const { fromData, setFromData, fromNames } = useModel("global") as any;

  const [currentTableName, setCurrentTableName] = useState<string>();
  const [currentTableData, setCurrentTableData] = useState<any[]>([]);
  const [disabledList, setDisabledList] = useState<string[]>([]);

  // 性能优化：防止重复提交
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 用于保存旧数据，实现乐观更新失败时的回滚
  const oldDataRef = useRef<any[]>([]);

  const [tableModalStatus, setTableModalStatus] = useState<
    string | "tabname" | "tabData" | "addItem"
  >();
  const [form] = Form.useForm();
  const [modalStatus, setModalStatus] = useState({
    Excel: false,
    Score: false,
    Guide: false,
  });

  const [rangeTabName, setRangeTabName] = useState("");
  const [currentKey, setCurrentKey] = useState("");

  // 导入表单逻辑处理
  const openModal = (value: string) => {
    const obj = { ...modalStatus };
    obj[value] = true;
    setModalStatus(obj);
  };

  const onClose = () => {
    const obj = { ...modalStatus };
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        obj[key] = false;
      }
    }
    setModalStatus(obj);
  };

  const getXlsxList = async () => {
    const resData = await window.electronAPI.readData();
    setFromData(resData.data);
    setDisabledList(resData.blockList);
  };

  useEffect(() => {
    getXlsxList();
  }, []);

  /**
   * 优化后的删除表格函数
   * 性能优化：
   * 1. 乐观更新 + 错误回滚
   * 2. useTransition 非阻塞更新
   */
  const delTab = useCallback(
    debounce(async (name: string) => {
      const oldData = fromData; // 保存引用
      // 乐观更新：立即从 UI 移除
      if (name === currentTableName) {
        setCurrentTableName(undefined);
      }
      // 使用 Immer 只更新需要变化的部分
      setFromData(
        produce((draft: any[]) => {
          const index = draft.findIndex((item: any) => item.listName === name);
          if (index !== -1) {
            draft.splice(index, 1);
          }
        })
      );

      try {
        await window.electronAPI.delTab(name);
        message.success("删除表格成功");
      } catch (error) {
        // 回滚
        setFromData(oldData);
        message.error("删除失败，请重试");
        console.error(error);
      }
    }, 400),
    [fromData, currentTableName]
  );

  /**
   * 优化后的修改状态函数
   */
  const rangeStatus = useCallback(
    debounce(async (key: string) => {
      const oldDisabledList = disabledList; // 保存引用
      // 乐观更新：立即更新 UI
      // 使用 Immer 只更新需要变化的部分
      setDisabledList(
        produce((draft: string[]) => {
          const index = draft.indexOf(key);
          if (index !== -1) {
            draft.splice(index, 1);
          } else {
            draft.push(key);
          }
        })
      );

      try {
        const res = await window.electronAPI.rangeStatus(key);
        setDisabledList(res);
      } catch (error) {
        // 回滚
        setDisabledList(oldDisabledList);
        console.error(error);
      }
    }, 200),
    [disabledList]
  );

  const delItem = useCallback(
    debounce(async (key: string) => {
      const oldData = fromData; // 保存引用
      // 乐观更新：立即从 UI 移除
      // 使用 Immer 只更新需要变化的部分
      setFromData(
        produce((draft: any[]) => {
          const table = draft.find(
            (item: any) => item.listName === currentTableName
          );
          if (table) {
            const index = table.data.findIndex(
              (record: any) => record.key === key
            );
            if (index !== -1) {
              table.data.splice(index, 1);
            }
          }
        })
      );

      try {
        await window.electronAPI.delTabItem(currentTableName, key);
        message.success("删除数据项成功");
      } catch (error) {
        // 回滚
        setFromData(oldData);
        message.error("删除失败，请重试");
        console.error(error);
      }
    }, 100),
    [fromData, currentTableName]
  );

  const nameColumns = [
    {
      title: "列表名",
      dataIndex: "value",
      ...ColumnSearchProps("value"),
    },
    {
      title: "总数",
      dataIndex: "population",
      sorter: (a, b) => a.population - b.population,
    },
    {
      title: "总分",
      dataIndex: "totalPoints",
      sorter: (a, b) => a.population - b.population,
    },
    {
      title: "上传时间",
      dataIndex: "time",
    },
    {
      title: () => {
        return (
          <>
            <span>
              <span>操作</span>
              <span style={{ color: "#919191" }}>（点击永久删除该表格）</span>
            </span>
          </>
        );
      },
      dataIndex: "operate",
      render: (value: any, record: any) => {
        return (
          <>
            <div className={style.operate}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  form.setFieldsValue({ name: record.value });
                  setTableModalStatus("tabname");
                  setRangeTabName(record.value);
                }}
              >
                修改
              </Button>
              <Button
                color="danger"
                variant="solid"
                onClick={async (e) => {
                  e.stopPropagation();
                  Modal.confirm({
                    title: "确认删除",
                    content: `您确定要删除【${record.value}】表单吗？此操作不可撤销（删除将清除数据库数据）`,
                    onOk: () => {
                      delTab(record.value);
                    },
                    onCancel: () => {},
                  });
                }}
              >
                移除
              </Button>
            </div>
          </>
        );
      },
    },
  ];

  const dataColumns = [
    {
      title: "编号",
      dataIndex: "code",
      ...ColumnSearchProps("code"),
    },
    {
      title: "姓名",
      dataIndex: "name",
      render: (value: any, record: any) => {
        return (
          <>
            <Avatar style={{ backgroundColor: record.color }}>
              {value.substring(value.length - 2)}
            </Avatar>
            &nbsp;&nbsp;
            <span>{value}</span>
          </>
        );
      },
      ...ColumnSearchProps("name"),
    },
    {
      title: "分数",
      dataIndex: "point",
      render: (value: number) => {
        if (!value) return 0;
        return value;
      },
    },
    {
      title: "操作",
      dataIndex: "operate",
      render: (value: any, record: any) => {
        return (
          <>
            <div className={style.operate}>
              <Button
                onClick={() => {
                  form.setFieldsValue({
                    code: record.code,
                    name: record.name,
                    point: record.point,
                  });
                  setTableModalStatus("tabData");
                  setCurrentKey(record.key);
                }}
              >
                修改
              </Button>
              <Button
                onClick={() => delItem(record.key)}
                color="danger"
                variant="solid"
              >
                移除
              </Button>
            </div>
          </>
        );
      },
    },
    {
      title: () => {
        return (
          <>
            <span>
              <span>状态</span>
              <span style={{ color: "#919191" }}>（点击控件改变状态）</span>
            </span>
          </>
        );
      },
      dataIndex: "status",
      render: (value: any, record: any) => {
        return (
          <>
            <div>
              {disabledList.includes(record.key) ? (
                <Button onClick={() => rangeStatus(record.key)}>禁用</Button>
              ) : (
                <Button
                  onClick={() => rangeStatus(record.key)}
                  color="cyan"
                  variant="solid"
                >
                  启用
                </Button>
              )}
            </div>
          </>
        );
      },
    },
  ];

  const confirmAction = async () => {
    // 防止重复提交
    if (isSubmitting) {
      message.warning("请勿重复提交");
      return;
    }

    const { code, name, point } = form.getFieldsValue();

    // 保存旧数据，用于乐观更新失败时回滚
    oldDataRef.current = fromData;

    setIsSubmitting(true);

    try {
      // 根据操作类型进行数据更新
      switch (tableModalStatus) {
        case "tabname": {
          if (!name) {
            message.error("请输入列表名！");
            return;
          }
          // 乐观更新：使用 Immer 只更新需要变化的部分
          setFromData(
            produce((draft: any[]) => {
              const target = draft.find(
                (item) => item.listName === rangeTabName
              );
              if (target) {
                target.listName = name;
              }
            })
          );
          await window.electronAPI.rangetabName(rangeTabName, name);
          message.success("修改列表名成功");
          break;
        }
        case "tabData": {
          if (!code || !name || point === undefined) {
            message.error("请输入完整数据！");
            return;
          }
          // 乐观更新：使用 Immer 只更新需要变化的部分
          setFromData(
            produce((draft: any[]) => {
              const table = draft.find(
                (item) => item.listName === currentTableName
              );
              if (table) {
                const record = table.data.find(
                  (r: any) => r.key === currentKey
                );
                if (record) {
                  record.code = code;
                  record.name = name;
                  record.point = point;
                }
              }
            })
          );
          // 在 produce 回调外部更新 currentTableData
          const updatedData =
            fromData.find((item: any) => item.listName === currentTableName)
              ?.data || [];
          setCurrentTableData(updatedData);
          await window.electronAPI.rangetabItem(currentTableName, currentKey, {
            code,
            name,
            point,
          });
          message.success("修改数据项成功");
          break;
        }
        default: {
          if (!code || !name || point === undefined) {
            message.error("请输入完整数据！");
            return;
          }
          if (!currentTableName) {
            message.error("未选中表格，无法添加元素！");
            return;
          }

          // 先保存旧的 fromData 用于乐观更新
          const oldFromData = fromData;

          // 乐观更新：先添加占位数据
          const tempKey = `temp_${Date.now()}`;
          setFromData(
            produce((draft: any[]) => {
              const table = draft.find(
                (item) => item.listName === currentTableName
              );
              if (table) {
                table.data.push({
                  key: tempKey,
                  code,
                  name,
                  point,
                  isTemp: true,
                });
              }
            })
          );

          try {
            const result = await window.electronAPI.rangeaddItem(
              currentTableName,
              {
                code,
                name,
                point,
              }
            );

            // 更新临时数据为真实数据
            if (result?.key) {
              setFromData(
                produce((draft: any[]) => {
                  const table = draft.find(
                    (item) => item.listName === currentTableName
                  );
                  if (table) {
                    const tempRecord = table.data.find(
                      (r: any) => r.key === tempKey
                    );
                    if (tempRecord) {
                      Object.assign(tempRecord, result, { isTemp: false });
                    }
                  }
                })
              );
            }
            message.success("添加数据项成功");
          } catch (error) {
            // 失败时回滚
            setFromData(oldFromData);
            throw error;
          }
          break;
        }
      }

      setTableModalStatus(undefined);
    } catch (error) {
      console.error("操作失败:", error);
      setFromData(oldDataRef.current);
      message.error("操作失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  useUpdateEffect(() => {
    const tableData =
      fromData.find((item: any) => item.listName === currentTableName)?.data ||
      [];
    setCurrentTableData(tableData);
  }, [currentTableName, fromData]);

  const downloadAll = () => {
    if (fromData.length === 0) {
      message.error("错误！导出数据为空！");
      return;
    }
    downloadTable(undefined, fromData, dataColumns, "all");
  };

  const download = () => {
    if (currentTableData.length === 0) {
      message.warning("请选择数据导出");
      return;
    }
    downloadTable(currentTableName, currentTableData, dataColumns);
  };

  return (
    <>
      <ImportModal
        modalStatus={modalStatus}
        onClose={onClose}
        getXlsxList={getXlsxList}
      ></ImportModal>

      <Modal
        title={
          tableModalStatus === "tabname"
            ? "修改列表名"
            : tableModalStatus === "tabData"
            ? "修改数据项"
            : "添加元素"
        }
        open={!!tableModalStatus}
        onCancel={() => {
          setTableModalStatus(undefined);
        }}
        onOk={confirmAction}
      >
        <Form form={form}>
          {tableModalStatus !== "tabname" && (
            <Form.Item name="code" label="输入编号：">
              <Input placeholder="请输入编号"></Input>
            </Form.Item>
          )}

          <Form.Item name="name" label="输入名称：">
            <Input placeholder="请输入名称"></Input>
          </Form.Item>

          {tableModalStatus !== "tabname" && (
            <Form.Item name="point" label="输入分数：">
              <Input type="number" placeholder="请输入分数"></Input>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Row>
        <Col span={24}>
          <Card className={style.Navbar}>
            <div>
              <Breadcrumb
                items={[
                  {
                    href: "/welcome",
                    title: "抽奖页",
                  },
                  {
                    title: "表单管理",
                  },
                ]}
                itemRender={(routes) => {
                  console.log("路由信息：", routes);
                  if (routes.href)
                    return (
                      <>
                        <Link to={routes.href}>{routes.title}</Link>
                      </>
                    );
                  return <span>{routes.title}</span>;
                }}
              />
            </div>
            <div>
              <Button
                type="primary"
                title="导入excel列表名单"
                onClick={() => openModal("Excel")}
              >
                <ImportOutlined />
                导入表格(excel)
              </Button>
              &nbsp;&nbsp;&nbsp;
              <Button type="primary" onClick={downloadAll}>
                下载全部表单
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <br></br>

      <Row justify="space-between" gutter={[16, 16]}>
        <Col span={24}>
          <Card className={style.area} title="所有添加列表（点击查看详情）">
            <Table
              columns={nameColumns}
              dataSource={fromNames}
              className={style.excelContent}
              style={{
                height: "33vh",
              }}
              scroll={{
                y: "20vh",
              }}
              rowHoverable={false}
              rowKey={"value"}
              rowClassName={(record, index) => {
                if (record.value === currentTableName) {
                  return style.selected_row;
                }
                return "";
              }}
              onRow={(record) => ({
                onClick: () => {
                  setCurrentTableName(record.value);
                },
              })}
            ></Table>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            className={style.area}
            title={`点击【${
              currentTableName ? currentTableName : "--"
            }】表格详情数据`}
            extra={
              <>
                <Button
                  type="primary"
                  onClick={() => {
                    setTableModalStatus("addItem");
                    form.resetFields();
                  }}
                >
                  <PlusCircleOutlined />
                  添加单个表单数据
                </Button>
                &nbsp;&nbsp;&nbsp;
                <Button type="primary" onClick={download}>
                  <DownloadOutlined />
                  下载【{currentTableName ? currentTableName : "--"}】表单数据
                </Button>
              </>
            }
          >
            <Table
              columns={dataColumns}
              dataSource={currentTableData}
              className={style.excelContent}
              rowHoverable={false}
              rowKey={"key"}
            ></Table>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default TableList;

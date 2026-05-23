// import { PageContainer } from '@ant-design/pro-components';

import {
  CloseCircleOutlined,
  CompassOutlined,
  DownloadOutlined,
  DownOutlined,
  ImportOutlined,
  InboxOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { CheckCard, SettingDrawer } from '@ant-design/pro-components';
import { PageHeader } from '@ant-design/pro-layout';
import { Link, useModel, useNavigate } from '@umijs/max';
import { useUpdateEffect } from 'ahooks';
import type { InputNumberProps, SelectProps } from 'antd';
import {
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Row,
  Select,
  Steps,
  Table,
  Tag,
  Upload,
} from 'antd';
import type { CheckboxGroupProps } from 'antd/es/checkbox';
import { info } from 'console';
import { debounce, includes, isBoolean, last } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ColumnSearchProps } from '../services/searchProps';
import ImportModal from '../Welcome/components/importModal';
import style from './index.less';
import { downloadTable } from './services';

const TableList: React.FC = () => {
  const navigate = useNavigate();
  const { fromData, setFromData, fromNames } = useModel('global') as any;

  const [currentTableName, setCurrentTableName] = useState<string>();
  const [currentTableData, setCurrentTableData] = useState<any[]>([]);
  const [disabledList, setDisabledList] = useState<string[]>([]);

  const [tableModalStatus, setTableModalStatus] = useState<
    string | 'tabname' | 'tabData' | 'addItem'
  >();
  const [form] = Form.useForm();
  const [modalStatus, setModalStatus] = useState({
    Excel: false,
    Score: false,
    Guide: false,
  });

  const [rangeTabName, setRangeTabName] = useState('');
  const [currentKey, setCurrentKey] = useState('');

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

  //-----------------------

  const getXlsxList = async () => {
    const resData = await window.electronAPI.readData();
    setFromData(resData.data);
    setDisabledList(resData.blockList);
    console.log('打印信息：', fromNames, resData);
  };

  useEffect(() => {
    getXlsxList();
  }, []);

  const delTab = debounce(async (name: string) => {
    if (name === currentTableName) {
      setCurrentTableName(undefined);
    }
    await window.electronAPI.delTab(name);
    await getXlsxList();
  }, 400);

  const rangeStatus = debounce(async (key: string) => {
    try {
      const res = await window.electronAPI.rangeStatus(key);
      console.log('禁用列表：', res);

      setDisabledList(res);
    } catch (err) {
      console.error(err);
    }
  }, 200);

  const delItem = debounce(async (key: string) => {
    const currentTabIndex = fromData.findIndex(
      (item) => item.listName === currentTableName,
    );
    const allTab = [...fromData];
    allTab[currentTabIndex].data = allTab[currentTabIndex].data.filter(
      (item) => item.key !== key,
    );
    setFromData(allTab);
    await window.electronAPI.delTabItem(currentTableName, key);
  }, 100);

  const nameColumns = [
    {
      title: '列表名',
      dataIndex: 'value',
      ...ColumnSearchProps('value'),
    },
    {
      title: '总数',
      dataIndex: 'population',
      sorter: (a, b) => a.population - b.population,
    },
    {
      title: '总分',
      dataIndex: 'totalPoints',
      sorter: (a, b) => a.population - b.population,
    },
    {
      title: '上传时间',
      dataIndex: 'time',
    },
    {
      title: () => {
        return (
          <>
            <span>
              <span>操作</span>
              <span style={{ color: '#919191' }}>（点击永久删除该表格）</span>
            </span>
          </>
        );
      },
      dataIndex: 'operate',
      render: (value: any, record: any) => {
        return (
          <>
            <div className={style.operate}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  form.setFieldsValue({ name: record.value });
                  setTableModalStatus('tabname');
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
                    title: '确认删除',
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
      title: '编号',
      dataIndex: 'code',
      ...ColumnSearchProps('code'),
    },
    {
      title: '姓名',
      dataIndex: 'name',
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
      ...ColumnSearchProps('name'),
    },
    {
      title: '分数',
      dataIndex: 'point',
      render: (value: number) => {
        if (!value) return 0;
        return value;
      },
    },
    {
      title: '操作',
      dataIndex: 'operate',
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
                  setTableModalStatus('tabData');
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
              <span style={{ color: '#919191' }}>（点击控件改变状态）</span>
            </span>
          </>
        );
      },
      dataIndex: 'status',
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
    const { code, name, point } = form.getFieldsValue();
    // console.log('弹窗信息：',form.getFieldsValue(),'所有表单：',fromData);
    // currentTableName
    // tableModalStatus

    switch (tableModalStatus) {
      case 'tabname': {
        const newData = [...fromData];
        const index = newData.findIndex(
          (item) => item.listName === rangeTabName,
        );
        newData[index].listName = name;
        setFromData(newData);
        await window.electronAPI.rangetabName(rangeTabName, name);
        return '修改列表名';
      }
      case 'tabData': {
        const newData = [...fromData];
        const index = newData.findIndex(
          (item) => item.listName === currentTableName,
        );
        newData[index].data = newData[index].data.map((item) => {
          if (item.key === currentKey) {
            const obj = { ...item };
            obj.code = code;
            obj.name = name;
            obj.point = point;
            return obj;
          }
          return item;
        });
        // console.log('弹窗信息：',newData[index].data)
        setCurrentTableData(newData[index].data);
        setFromData(newData);
        await window.electronAPI.rangetabItem(currentTableName, currentKey, {
          code,
          name,
          point,
        });
        return '修改数据项';
      }
      // case 'addItem':{
      //   return '添加元素';}
      default: {
        if (!currentTableName) {
          message.error('未选中表格，无法添加元素！');
          return;
        }
        const newData = [...fromData];
        const index = newData.findIndex(
          (item) => item.listName === currentTableName,
        );
        const res = await window.electronAPI.rangeaddItem(currentTableName, {
          code,
          name,
          point,
        });
        newData[index].data.push(res);
        setFromData(newData);
        return '添加数据项';
      }
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
      message.error('错误！导出数据为空！');
      return;
    }
    downloadTable(undefined, fromData, dataColumns, 'all');
  };

  const download = () => {
    if (currentTableData.length === 0) {
      message.warning('请选择数据导出');
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
          tableModalStatus === 'tabname'
            ? '修改列表名'
            : tableModalStatus === 'tabData'
              ? '修改数据项'
              : '添加元素'
        }
        open={!!tableModalStatus}
        onCancel={() => {
          setTableModalStatus(undefined);
        }}
        onOk={confirmAction}
      >
        <Form
          form={form}
          // onFinish={onFinish}
        >
          {tableModalStatus !== 'tabname' && (
            <Form.Item name="code" label="输入编号：">
              <Input placeholder="请输入编号"></Input>
            </Form.Item>
          )}

          <Form.Item name="name" label="输入名称：">
            <Input placeholder="请输入名称"></Input>
          </Form.Item>

          {tableModalStatus !== 'tabname' && (
            <Form.Item name="point" label="输入分数：">
              <Input placeholder="请输入分数"></Input>
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
                    href: '/welcome',
                    title: '抽奖页',
                  },
                  {
                    title: '表单管理',
                  },
                ]}
                itemRender={(routes) => {
                  console.log('路由信息：', routes);
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
                onClick={() => openModal('Excel')}
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
                height: '33vh',
              }}
              scroll={{
                y: '20vh',
              }}
              rowHoverable={false}
              rowKey={'value'}
              rowClassName={(record, index) => {
                if (record.value === currentTableName) {
                  return style.selected_row;
                }
                return '';
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
            title={`点击【${currentTableName ? currentTableName : '--'}】表格详情数据`}
            extra={
              <>
                <Button
                  type="primary"
                  onClick={() => {
                    setTableModalStatus('addItem');
                    form.resetFields();
                  }}
                >
                  <PlusCircleOutlined />
                  添加单个表单数据
                </Button>
                &nbsp;&nbsp;&nbsp;
                <Button type="primary" onClick={download}>
                  <DownloadOutlined />
                  下载【{currentTableName ? currentTableName : '--'}】表单数据
                </Button>
              </>
            }
          >
            <Table
              columns={dataColumns}
              dataSource={currentTableData}
              className={style.excelContent}
              rowHoverable={false}
              rowKey={'key'}
            ></Table>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default TableList;

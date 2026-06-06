import { SearchOutlined } from "@ant-design/icons";
import type { TableColumnType } from "antd";
import { Button, Input, Space } from "antd";

interface DataType {
  value: string;
  name: string;
  code: string;
}

type DataIndex = keyof DataType;
export const ColumnSearchProps = (
  dataIndex: DataIndex
): TableColumnType<DataType> => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
    close,
  }) => (
    <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
      <Input
        placeholder={`输入搜索文字`}
        value={selectedKeys[0]}
        onChange={(e) =>
          setSelectedKeys(e.target.value ? [e.target.value] : [])
        }
        style={{ marginBottom: 8, display: "block" }}
      />
      <Space>
        <Button
          type="primary"
          size="small"
          onClick={() => {
            confirm({ closeDropdown: false });
          }}
        >
          查询
        </Button>
        <Button
          onClick={() => {
            clearFilters;
            setSelectedKeys([]);
            confirm({ closeDropdown: true });
          }}
          size="small"
          style={{ width: 90 }}
        >
          重置
        </Button>
        <Button
          type="link"
          size="small"
          onClick={() => {
            close();
          }}
        >
          取消
        </Button>
      </Space>
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
  ),
  onFilter: (value, record) =>
    record[dataIndex]
      .toString()
      .toLowerCase()
      .includes((value as string).toLowerCase()),
});

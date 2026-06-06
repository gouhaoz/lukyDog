import { InboxOutlined } from "@ant-design/icons";
import { Input, Modal, Radio, Upload, message } from "antd";
import React, { useState } from "react";
import style from "./index.less";

interface ModalType {
  modalStatus: any;
  onClose: () => void;
  getXlsxList: () => void;
}

const ImportModal: React.FC<ModalType> = ({
  modalStatus,
  onClose,
  getXlsxList,
}) => {
  const [uploadFileName, setUploadFileName] = useState<string | undefined>("");
  const [sheetList, setSheetList] = useState([]);
  const [currentSheet, setCurrentSheet] = useState<string | undefined>(
    undefined
  );
  const [fileList, setFileList] = useState([]);
  const { Dragger } = Upload;

  const onChangeFile = async (fileValue: any) => {
    setFileList(fileValue.fileList);
    const file = fileValue.file.originFileObj;
    if (fileValue.file.status !== "done") return;
    const fileName = file.name.split(".")[0];
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileData = {
      name: fileName,
      originalName: file.name,
      type: file.type,
      size: file.size,
      data: Array.from(uint8Array),
    };
    try {
      const result = await window.electronAPI.readFile(fileData);
      console.log("上传结果:", result);
      message.success("读取文件成功！");
      setUploadFileName(fileName);
      setSheetList(result);
      setCurrentSheet(result[0]);
    } catch (err) {
      message.error(`读取文件失败！错误：${err}`);
    }
  };

  const onRemoveFile = () => {
    setSheetList([]);
    // setCurrentSheet(undefined)
    setUploadFileName(undefined);
  };

  const onSend = async () => {
    if (sheetList?.length === 0) {
      message.warning("请选择文件上传！");
      return;
    }
    try {
      console.log("传入参数：", uploadFileName, currentSheet);

      await window.electronAPI.addTableData(uploadFileName, currentSheet);
      message.success("文件成功添加");
    } catch (err) {
      message.error(`数据入库失败！${err}`);
      return;
    }
    setUploadFileName("");
    setSheetList([]);
    setFileList([]);
    onClose();
    await getXlsxList();
  };

  const onChangeName = (e) => {
    setUploadFileName(e.target.value);
  };

  return (
    <>
      <Modal
        title="导入文件"
        open={modalStatus["Excel"]}
        onCancel={onClose}
        className={style.modal}
        onOk={onSend}
      >
        <div>
          <p>1.选择文件*：(必选)</p>
          <Dragger
            accept=".xlsx,.excel,.xls"
            onChange={onChangeFile}
            // beforeUpload={onChangeFile}
            maxCount={1}
            onRemove={onRemoveFile}
            fileList={fileList}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击/拖动文件至区域内可上传</p>
            <p className="ant-upload-hint">只能上传xlsx\excel\xls后缀文件</p>
          </Dragger>
          <br></br>
          <div>
            修改名称：
            <Input
              onChange={onChangeName}
              placeholder="请输入导入文件名称：（用于分组管理）"
              value={uploadFileName}
            ></Input>
          </div>

          {sheetList.length !== 0 ? (
            <>
              <br></br>
              <div>
                2.选择工作表：
                <br></br>
                <Radio.Group
                  value={currentSheet}
                  onChange={(e) => setCurrentSheet(e.target.value)}
                  options={sheetList}
                  optionType="button"
                />
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </>
  );
};

export default ImportModal;

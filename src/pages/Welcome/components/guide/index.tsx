import { Button, Carousel, Col, Image, Modal, Row } from "antd";
import React, { useRef } from "react";
import style from "./index.less";

interface ModalType {
  modalStatus: any;
  onClose: () => void;
}

const GuideModal: React.FC<ModalType> = ({ modalStatus, onClose }) => {
  const MODALVW = 1000;

  const onSend = () => {
    onClose();
  };

  const carouselRef = useRef<any>(null);

  // const contentStyle: React.CSSProperties = {
  //   margin: 0,
  //   height: '160px',
  //   color: '#fff',
  //   lineHeight: '160px',
  //   textAlign: 'center',
  //   background: '#364d79',
  // };

  const guideSteps = [
    {
      title: "如何处理选择上传文件",
      content: "点击/拖动文件至区域内可上传",
      img: [
        "./img/Guide/Import_img1.png",
        "./img/Guide/Import_img2.png",
        "./img/Guide/Import_img3.png",
      ],
    },
    {
      title: "如何抽奖",
      content: "选取到合适的表格（可多选），选择数量，选择模式即可点击抽奖。",
      img: ["./img/Guide/Draw.png"],
    },
    {
      title: "如何打分",
      content:
        "点击奖池里的元素即可打分，还可以设置高级打分规则，可自定义选项打分；打完分后，点击确认即可保存添加打分。",
      img: [
        "./img/Guide/Score_img1.png",
        "./img/Guide/Score_img2.png",
        "./img/Guide/Score_img3.png",
      ],
    },
    {
      title: "如何管理数据",
      content: "点击管理导入表单可管理修改导入的表单数据，也可以下载数据。",
      img: ["./img/Guide/Data_Processing.png"],
    },
    {
      title: "查看仓库及指南",
      content:
        "若还想查看此教程可点击查看使用指南；若想查看项目源码可点击项目仓库链接。",
      img: ["./img/Guide/git_and_Guide.png"],
    },
  ];

  return (
    <>
      <Modal
        title="使用引导"
        open={modalStatus["Guide"]}
        onCancel={onClose}
        // className={style.modal}
        // onOk={onSend}
        // okText="知道了"
        width={MODALVW}
        cancelButtonProps={{ style: { display: "none" } }}
        footer={
          <>
            <Button
              color="primary"
              onClick={() => carouselRef.current?.prev()}
              variant="outlined"
            >
              上一步
            </Button>
            <Button
              color="primary"
              onClick={() => carouselRef.current?.next()}
              variant="outlined"
            >
              下一步
            </Button>
            <Button type="primary" onClick={onSend} variant="outlined">
              知道了
            </Button>
          </>
        }
      >
        <Carousel ref={carouselRef} dots={true} className={style.guideCarousel}>
          {guideSteps.map((item, index) => {
            return (
              <div key={index}>
                <h3>
                  {index + 1}.{item.title}
                </h3>

                <Row className={style.imgList}>
                  {item.img.map((img, index2) => (
                    <Col span={item.img.length >= 2 ? 12 : 24}>
                      <div key={index2} className={style.tutorial}>
                        <h4>图{index2 + 1}</h4>
                        <Image width={"100%"} src={img} />
                      </div>
                    </Col>
                  ))}
                </Row>
                <br></br>
                <p>{item.content}</p>
                <br></br>
              </div>
            );
          })}
        </Carousel>
      </Modal>
    </>
  );
};

export default GuideModal;

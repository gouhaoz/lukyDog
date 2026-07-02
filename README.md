<img src="./public/icons/logo.png" alt="产品" width="100">

# LuckyDog(1.0Pro)抽奖程序

这是一个基于 Electron + React（antd） 框架的 xlsx 表格抽奖程序；只适用于在 Windows 系统上进行抽奖活动。

## 安装包下载

- [Windows 最新版本（点击下载）](https://github.com/gouhaoz/lukyDog/releases/download/1.0.0/Lucky.Dog.1.0Pro.Setup.6.0.0.exe)
- [查看程序使用指南](https://github.com/gouhaoz/lukyDog/blob/master/USER_GUIDE.md)

## 主要功能

- exe 安装包安装即用，xlsx 导入抽奖源数(可选择导入子工作表)据+导出功能(导出单个或者全部导出)，以及程序内数据管理、多种打分功能(选项打分/自定义打分)、可选取指定数据源进行抽奖、以及多种抽奖模式（连抽、单抽、低概率抽、默认概率抽、以及可以禁止某个数据参与抽奖）、栅格化适配屏幕大小、导入数据模糊搜索、分数排序等，确保该程序能适应多种娱乐环境等。

### 开发环境启动命令：

npm：

```bash
npm run electron:dev
```

yarn：

```bash
yarn electron:dev
```

### 生产环境打包命令：

npm：

```bash
npm run electron:build
```

yarn：

```bash
yarn electron:build
```

## 主要技术栈

- Electron
- React
- Ant Design Pro
- TypeScript
- Node.js
- SqLite3

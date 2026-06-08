import { AvatarDropdown, AvatarName, Footer } from "@/components";
import type { Settings as LayoutSettings } from "@ant-design/pro-components";
import type { RequestConfig, RunTimeLayoutConfig } from "@umijs/max";
import bjImg from "./assets/bj.png";
import "./global.less";
import { errorConfig } from "./requestErrorConfig";

document.addEventListener("dragover", (e) => {
  e.preventDefault();
});
document.addEventListener("drop", (e) => {
  e.preventDefault();
});

// 设置背景图片 CSS 变量
if (typeof document !== "undefined") {
  document.documentElement.style.setProperty("--bg-image-url", `url(${bjImg})`);
  console.log("✅ 背景图片 CSS 变量已设置:", bjImg);
}

// 调试：检查 React 是否能正常运行
console.log("✅ app.tsx 加载成功");
console.log("✅ process.env.NODE_ENV:", process.env.NODE_ENV);

const isDev = process.env.NODE_ENV === "development";
const isDevOrTest = isDev || process.env.CI;
const loginPath = "/user/login";

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  return {
    settings: {
      navTheme: "light",
      layout: "mix",
      contentWidth: "Fluid",
      fixedHeader: false,
      fixSiderbar: true,
      colorWeak: false,
      menu: {
        locale: true,
      },
      title: "Luky Dog",
      pwa: false,
      iconfontUrl: "",
    },
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    // logo:'../dist/logo.png',
    actionsRender: () => [
      // <Question key="doc" />,
      // <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      // const { location } = history;
      // // 如果没有登录，重定向到 login
      // if (!initialState?.currentUser && location.pathname !== loginPath) {
      //   history.push(loginPath);
      // }
    },
    bgLayoutImgList: [
      {
        src: "https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr",
        left: 85,
        bottom: 100,
        height: "303px",
      },
      {
        src: "https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr",
        bottom: -68,
        right: -45,
        height: "303px",
      },
      {
        src: "https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr",
        bottom: 0,
        left: 0,
        width: "331px",
      },
    ],
    // links: isDevOrTest
    //   ? [
    //       <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
    //         <LinkOutlined />
    //         <span>OpenAPI 文档</span>
    //       </Link>,
    //     ]
    //   : [],
    menuHeaderRender: undefined,
    menuRender: false,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <div
          style={{
            backgroundImage: `url(${bjImg})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
            minHeight: "100vh",
            width: "100%",
          }}
        >
          {children}
          {/* {isDevOrTest && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )} */}
        </div>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL: isDev ? "" : "https://proapi.azurewebsites.net",
  ...errorConfig,
};

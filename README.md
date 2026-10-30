> 模板版本：v0.4.2

<p align="center">
  <h1 align="center"> <code>react-native-keychain</code> </h1>
</p>

 本项目基于 [react-native-keychain](https://github.com/oblador/react-native-keychain)开发。

## 安装与使用

请到三方库的 Releases 发布地址查看配套的版本信息：

| 三方库名称 | 三方库版本（npm地址）                                                                           | 发布信息                                                                                         | 支持RN版本                             | Autolink | 编译API版本 | 社区基线版本 | 源码地址                                                                             |
| ------------ |----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|------------------------------------|--------------------|---------|--------|----------------------------------------------------------------------------------|
|@react-native-ohos/react-native-keychain| [~10.0.1(开发中)](https://www.npmjs.com/package/@react-native-ohos/react-native-keychain) | [Github Releases](https://github.com/react-native-oh-library/react-native-keychain/releases) | 0.86.*、0.84.*、0.82.*、0.77.*、0.72.* | 是     | API12+  | 10.0.0 | [master](https://github.com/react-native-oh-library/react-native-keychain/tree/master) |

## 简介

React Native Keychain 是密钥/凭据安全存储库，提供在设备安全存储中保存用户名、密码等敏感信息的跨平台 API。

## 下载安装

进入到工程目录并输入以下命令

#### **npm**

```bash
# npm 发布后
npm install @react-native-ohos/react-native-keychain

# 当前随工程 tgz 安装
npm install ./rnoh_package/react-native-ohos-react-native-keychain-10.0.1-rc.1.tgz
```

#### **yarn**

```bash
yarn add @react-native-ohos/react-native-keychain
```

## Link

|         | 是否支持 Autolink  | 支持的 RN 版本                        |
|---------|-----------------------|----------------------------------|
| ~10.0.1 |  是              | 0.86 / 0.84 / 0.82 / 0.77 / 0.72 |

使用AutoLink的工程需要根据该文档配置，Autolink框架指导文档：https://gitcode.com/CPF-RN/ohos_react_native/blob/master/docs/zh-cn/Autolinking.md

如您使用的版本支持 Autolink，并且工程已接入 Autolink，可跳过ManualLink配置。

<details>
  <summary>ManualLink: 此步骤为手动配置原生依赖项的指导</summary>

首先需要使用 DevEco Studio 打开项目里的 HarmonyOS 工程 `harmony`

### 1.在工程根目录的 `oh-package.json5` 添加 overrides 字段

```json
{
  ...
  "overrides": {
    "@rnoh/react-native-openharmony" : "./react_native_openharmony"
  }
}
```

### 2.引入原生端代码

目前有两种方法：

1. 通过 har 包引入（在 IDE 完善相关功能后该方法会被遗弃，目前首选此方法）；
2. 直接链接源码。

方法一：通过 har 包引入

> [!TIP] har 包位于三方库安装路径的 `harmony` 文件夹下。

打开 `entry/oh-package.json5`，添加以下依赖

```json
"dependencies": {
    "@rnoh/react-native-openharmony": "file:../react_native_openharmony",

    "@react-native-ohos/react-native-keychain": "file:../../node_modules/@react-native-ohos/react-native-keychain/harmony/rn_keychain.har"
}
```

点击右上角的 `sync` 按钮

或者在终端执行：

```bash
cd entry
ohpm install
```

方法二：直接链接源码

> [!TIP] 如需使用直接链接源码，请参考[直接链接源码说明](https://gitcode.com/CPF-RN/usage-docs/blob/master/zh-cn/link-source-code.md)

### 3.配置 CMakeLists 和引入 RNKeychainPackage

打开 `entry/src/main/cpp/CMakeLists.txt`，添加：

```diff
# RNOH_BEGIN: manual_package_linking_1
+ set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")
+ add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-keychain/src/main/cpp" ./keychain)

# RNOH_END: manual_package_linking_1
...

# RNOH_BEGIN: manual_package_linking_2
+ target_link_libraries(rnoh_app PUBLIC rnoh_keychain)
# RNOH_END: manual_package_linking_2
```

打开 `entry/src/main/cpp/PackageProvider.cpp`，添加：

```diff
#include "RNOH/PackageProvider.h"
+ #include "RNKeychainPackage.h"

using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
+     std::make_shared<rnoh::RNKeychainPackage>(ctx)
    };
}
```

### 4.在 ArkTs 侧引入 KeychainPackage

打开 `entry/src/main/ets/RNPackagesFactory.ets`，添加：

```diff
import type {RNPackageContext, RNPackage} from '@rnoh/react-native-openharmony/ts';
+ import { KeychainPackage } from '@react-native-ohos/react-native-keychain/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
+   new KeychainPackage(ctx)
  ];
}
```

> [!TIP] 本库为纯 TurboModule 库，不包含自定义原生组件，**无需**配置 `buildCustomComponent` 与 `arkTsComponentNames`。
</details>

### 运行

点击右上角的 `sync` 按钮

或者在终端执行：

```bash
cd entry
ohpm install
```

然后编译、运行即可。

## 约束与限制

### 兼容性

要使用此库，需要使用正确的 React-Native 和 RNOH 版本。另外，还需要使用配套的 DevEco Studio 和 手机 ROM。

在以下版本验证通过：

1. RNOH: 0.84.1; SDK: HarmonyOS 6.0.1 Release SDK（API 21）;

> [!TIP] `accessControl` 认证流程（指纹/人脸/锁屏密码弹窗）需在真机上验证，模拟器生物识别能力受限。

## 使用示例

下面的代码展示了这个库的基本使用场景：

> [!WARNING] 鸿蒙适配版包名为 `@react-native-ohos/react-native-keychain`，JS API 与上游完全一致。

```js
import * as Keychain from '@react-native-ohos/react-native-keychain';

// 普通存储与读取
await Keychain.setGenericPassword('username', 'password', {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
});
const credentials = await Keychain.getGenericPassword();
if (credentials) {
  console.log(credentials.username, credentials.password);
}

// 认证保护存储：读取时需通过指纹/人脸/锁屏密码认证
await Keychain.setGenericPassword('username', 'password', {
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
});
const authed = await Keychain.getGenericPassword({
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
  authenticationPrompt: { title: '请验证身份以读取密码' },
});

// 用完即删
await Keychain.resetGenericPassword();
```

## 使用说明

```js
await Keychain.setGenericPassword('username', 'password', {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
});
```


### 函数

> [!TIP] "平台"列表示该 API 在原三方库上支持的平台。

> [!TIP] "OpenHarmony平台支持"列为 yes 表示 OpenHarmony 平台支持该 API；no 则表示不支持；partially 表示部分支持。使用方法跨平台一致，效果对标 iOS 或 Android 的效果。

#### 通用密码

| 名称 | 描述 | 类型     | 必填     | 平台     | OpenHarmony平台支持          |
| ---------------------------------- | ------------------------------------- | -------- | -------- | -------- | ----------------- |
| `setGenericPassword(username, password, options?)` | 保存/更新通用凭据，service 已存在则覆盖。返回写入结果。 | function | 是       | All      |yes|
| `getGenericPassword(options?)` | 读取通用凭据，未存凭据时返回 `false`。options 带 `accessControl` 时每次强制触发用户认证。 | function | 是       | All      |yes|
| `hasGenericPassword(options?)` | 查询是否已存通用凭据。 | function | 是       | All      |yes|
| `resetGenericPassword(options?)` | 删除通用凭据。 | function | 是       | All      |yes|
| `getAllGenericPasswordServices(options?)` | 返回已存所有通用凭据的 service 列表。 | function | 是       | iOS,Android      |yes|

#### 网络凭据

| 名称 | 描述 | 类型     | 必填     | 平台     | OpenHarmony平台支持          |
| ---------------------------------- | ---------------------------------------- | -------- | -------- | -------- | ----------------- |
| `setInternetCredentials(server, username, password, options?)` | 以 server 为标识保存网络凭据。 | function | 是       | All      |yes|
| `getInternetCredentials(server, options?)` | 读取指定 server 的网络凭据，未存时返回 `false`。 | function | 是       | All      |yes|
| `hasInternetCredentials({ server })` | 查询指定 server 是否已存凭据。 | function | 是       | All      |yes|
| `resetInternetCredentials({ server })` | 删除指定 server 的网络凭据。 | function | 是       | All      |yes|

#### 设备能力

| 名称 | 描述 | 类型     | 必填 | 平台     | OpenHarmony平台支持                                          |
| ---------------------------------- | --------------------- | -------- | -- | -------- |----------------------------------------------------------|
| `getSupportedBiometryType()` | 返回设备支持的生物识别类型。 | function | 是 | iOS,Android | yes          |
| `canImplyAuthentication(options?)` | 判断设备是否可进行身份认证。 | function | 是 | iOS,Android | yes                                                      |
| `getSecurityLevel(options?)` | 返回本设备能否安全存储凭据及安全级别。 | function | 是 | iOS,Android | yes |
| `isPasscodeAuthAvailable()` | 判断锁屏密码（PIN）是否可用。 | function | 是 | iOS,Android | yes                                                      |

#### Shared Web Credentials

| 名称 | 描述 | 类型     | 必填     | 平台     | OpenHarmony平台支持         |
| ---------------------------------- | -------------------------------- | -------- | -------- | -------- | ---------------- |
| `requestSharedWebCredentials()` | 请求共享的 Web 凭据。 | function | 是       | iOS      |no|
| `setSharedWebCredentials(server, username, password?)` | 保存共享的 Web 凭据。 | function | 是       | iOS      |no|

### Options

| 名称 | 描述               | 类型     | 必填     | 平台                    | OpenHarmony平台支持                                        |
|------------------------------------| ---------------------- | -------- | -------- | ----------------------- |--------------------------------------------------------|

| `accessible?` | 凭据可访问时机，默认 `AFTER_FIRST_UNLOCK`。 | ACCESSIBLE | 否       | All                     | yes                                                    |
| `accessControl?` | 读取凭据时要求用户认证（PIN/人脸/指纹）。 | ACCESS_CONTROL | 否       | iOS,Android             | partially（`APPLICATION_PASSWORD` 不支持）                  |
| `authenticationType?` | 生物认证类型，影响 `canImplyAuthentication` 的探测范围。 | AUTHENTICATION_TYPE | 否       | iOS,Android             | yes                                                    |
| `cloudSync?` | 写入时标记同步到用户授权的受信设备。 | boolean | 否       | iOS             | no            |
| `service?` | 自定义服务名，未传时默认为应用包名。 | string | 否       | All                     | yes                                                    |
| `server?` | 网络凭据的服务器地址标识（internet credentials 专用）。 | string | 否       | All                     | yes                                                    |
| `authenticationPrompt?` | 认证弹窗文案。 | object | 否       | iOS,Android             | partially（仅 title属性 生效，subtitle、description、cancel不支持） |
| `securityLevel?` | 要求的存储安全级别。 | SECURITY_LEVEL | 否       | Android             | no                               |

### 枚举

| 名称                    | 描述 | 取值                                                                                                                                                                                                                                                                                                                                                                          | OpenHarmony平台支持                                                           |
|-----------------------| ------------------------------------------------------------ |-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `ACCESSIBLE`          | 凭据可访问时机 | WHEN_UNLOCKED / AFTER_FIRST_UNLOCK / ALWAYS / WHEN_PASSCODE_SET_THIS_DEVICE_ONLY / WHEN_UNLOCKED_THIS_DEVICE_ONLY / AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY                                                                                                                                                                                                                     | yes                                                                       |
| `ACCESS_CONTROL`      | 访问控制策略 | USER_PRESENCE / BIOMETRY_ANY / BIOMETRY_CURRENT_SET / DEVICE_PASSCODE / APPLICATION_PASSWORD / BIOMETRY_ANY_OR_DEVICE_PASSCODE / BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE                                                                                                                                                                                                    | partially（除 `APPLICATION_PASSWORD` 外均支持）                                  |
| `AUTHENTICATION_TYPE` | 认证类型 | DEVICE_PASSCODE_OR_BIOMETRICS / BIOMETRICS          | yes（影响 `canImplyAuthentication`；写入侧认证类型统一为 ANY）                           |
| `BIOMETRY_TYPE`       | 生物识别类型 | FINGERPRINT / FACE / IRIS / TOUCH_ID / FACE_ID / OPTIC_ID   | partially（支持:FINGERPRINT/FACE；不支持:IRIS / TOUCH_ID / FACE_ID / OPTIC_ID  ） |
| `SECURITY_LEVEL`      | 存储安全级别 | SECURE_SOFTWARE / SECURE_HARDWARE / ANY | partially（支持：SECURE_SOFTWARE； 不支持： SECURE_HARDWARE / ANY）                 |
| `ERROR_CODE`          | 错误码 | E_PASSCODE_NOT_SET / E_BIOMETRIC_NOT_ENROLLED / E_BIOMETRIC_TIMEOUT / E_BIOMETRIC_LOCKOUT / E_BIOMETRIC_LOCKOUT_PERMANENT / E_BIOMETRIC_TEMPORARILY_UNAVAILABLE / E_BIOMETRIC_UNAVAILABLE / E_BIOMETRIC_VENDOR_ERROR / E_AUTH_INTERACTION_NOT_ALLOWED / E_AUTH_INVALIDATED / E_AUTH_CANCELED / E_AUTH_ERROR / E_INVALID_PARAMETERS / E_STORAGE_ACCESS_ERROR / E_INTERNAL_ERROR | yes（以 `error.code` 形式返回，由 JS 层从 message 前缀还原）                             |
| `STORAGE_TYPE`          | 指定加密算法 | AES_CBC / AES_GCM_NO_AUTH / AES_GCM / RSA                                                                                                                                                                                                                                                                                                                                   | no                                                                        |

## 遗留问题

- [ ] getSecurityLevel 已实现但恒返回 SECURE_SOFTWARE，无法像上游 Android 区分 SECURE_HARDWARE/SECURE_SOFTWARE（无公开 API 可查询密钥安全环境，不做硬件级承诺）
- [ ] ACCESS_CONTROL.APPLICATION_PASSWORD 不支持
- [ ] STORAGE_TYPE 加密由 Asset Store Kit 系统级加密承担，不支持应用自选算法
- [ ] requestSharedWebCredentials 为 iOS 独有能力，鸿蒙上不支持
- [ ] setSharedWebCredentials 为 iOS 独有能力，鸿蒙上不支持
- [ ] securityLevel中的SECURE_HARDWARE、ANY 不支持，鸿蒙关键资产无分级 API
- [ ] authenticationPrompt 仅 title 生效，subtitle、description、cancel鸿蒙不支持
- [ ] 参数Options.cloudSync 鸿蒙不支持
- [ ] BIOMETRY_TYPE 枚举中 IRIS 鸿蒙不支持（公开 SDK 的 UserAuthType 无虹膜类型）

## 其他

## 目录结构

````
react-native-keychain/
├── harmony/                              # 鸿蒙（OHOS）平台适配层
│   └── rn_keychain/                      # 鸿蒙库模块
│       ├── BuildProfile.ets              # 构建配置
│       ├── README.md                     # 中文说明文档
│       ├── README_en.md                  # 英文说明文档
│       ├── build-profile.json5           # 模块构建配置
│       ├── consumer-rules.txt            # 消费者混淆规则
│       ├── hvigorfile.ts                 # Hvigor 构建脚本
│       ├── index.ets                     # 模块入口
│       ├── obfuscation-rules.txt         # 代码混淆规则
│       ├── oh-package-lock.json5         # OHOS 依赖锁定文件
│       ├── oh-package.json5              # OHOS 包配置
│       ├── ts.ets                        # TS 类型定义入口
│       └── src/main/
│           ├── module.json5              # 模块清单
│           ├── cpp/                      # C++ 原生代码
│           │   ├── CMakeLists.txt        # CMake 构建脚本
│           │   ├── RNKeychainPackage.h   # 包注册类
│           │   └── generated/            # 代码生成文件
│           │       ├── RNOH/generated/
│           │       │   ├── BaseReactNativeKeychainPackage.h
│           │       │   └── turbo_modules/
│           │       │       ├── RNKeychainManager.cpp    # TurboModule 实现
│           │       │       └── RNKeychainManager.h
│           │       └── react/renderer/components/react_native_keychain/
│           │           ├── ComponentDescriptors.h      # 组件描述符
│           │           ├── EventEmitters.cpp / .h      # 事件发射器
│           │           ├── Props.cpp / .h              # 属性
│           │           ├── ShadowNodes.cpp / .h        # 阴影节点
│           │           └── States.cpp / .h             # 状态
│           ├── ets/                      # ArkTS 实现
│           │   ├── KeychainPackage.ets   # 包注册
│           │   ├── KeychainTurboModule.ets # TurboModule 鸿蒙实现
│           │   ├── Logger.ets            # 日志工具
│           │   └── generated/            # 代码生成文件
│           │       ├── components/ts.ts
│           │       ├── index.ets
│           │       ├── ts.ts
│           │       └── turboModules/
│           │           ├── RNKeychainManager.ts        # TurboModule 接口
│           │           └── ts.ts
│           └── resources/                # 资源文件
│               └── base/element/string.json
├── src/                                  # JS/TS 源码
│   ├── NativeKeychainManager.ts          # TurboModule 原生接口定义
│   ├── enums.ts                          # 枚举定义
│   ├── index.ts                          # 库主入口
│   ├── normalizeOptions.ts               # 选项规范化工具
│   └── types.ts                          # 类型定义
├── .editorconfig                         # 编辑器配置
├── .eslintignore                         # ESLint 忽略配置
├── .eslintrc.js                          # ESLint 配置
├── .gitignore                            # Git 忽略配置
├── .prettierrc                           # Prettier 格式化配置
├── .yarnrc.yml                           # Yarn 配置
├── LICENSE                               # 开源许可证
├── README.md                             # 项目说明文档
├── babel.config.js                       # Babel 编译配置
├── package.json                          # npm 包配置
├── package-lock.json                     # npm 依赖锁定文件
├── tsconfig.build.json                   # TS 构建配置
├── tsconfig.json                         # TS 基础配置
└── yarn.lock                             # Yarn 依赖锁定文件

````

## 贡献代码

使用过程中发现任何问题都可以提交 [Issue](https://github.com/react-native-oh-library/react-native-keychain/issues)，当然，也非常欢迎提交 [PR](https://github.com/react-native-oh-library/react-native-keychain/pull)

## 开源协议

本项目基于 [The MIT License (MIT)](https://github.com/oblador/react-native-keychain/blob/master/LICENSE.md) ，请自由地享受和参与开源。

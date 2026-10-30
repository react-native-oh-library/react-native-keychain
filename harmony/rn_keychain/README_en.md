> Template version: v0.4.2

<p align="center">
  <h1 align="center"> <code>react-native-keychain</code> </h1>
</p>

This project is based on [react-native-keychain](https://github.com/oblador/react-native-keychain).

## Installation and Usage

Go to the Releases page of the third-party library to check the version information:

| Name | Version(Npm Address)                                                                              | Release Information  | Supported RN Version                       | Supported Autolink | Compile API Version | Community Baseline Version | Source code link|
| - |---------------------------------------------------------------------------------------------------| - |--------------------------------------------| - | - | - | - |
|@react-native-ohos/react-native-keychain| [~10.0.1(In development)](https://www.npmjs.com/package/@react-native-ohos/react-native-keychain) | [Github Releases](https://github.com/react-native-oh-library/react-native-keychain/releases) | 0.86.* / 0.84.* / 0.82.* / 0.77.* / 0.72.* | Yes     | API21+                   | 10.0.0 | [sig](https://github.com/react-native-oh-library/react-native-keychain/tree/sig) |

## Introduction

React Native Keychain is a library for secure credential storage. It provides a cross-platform API for saving sensitive information such as usernames and passwords in device-secured storage (iOS Keychain / Android Keystore / HarmonyOS Asset Store). The HarmonyOS adapter is implemented on top of the system **Asset Store Kit (`@ohos.security.asset`)** and **user authentication (`@ohos.userIAM.userAuth`)**.

## Download and install

Go to the project directory and execute the following instruction:

**npm**

```bash
# After being published to npm
npm install @react-native-ohos/react-native-keychain

# Currently installed from the project-local tgz
npm install ./rnoh_package/react-native-ohos-react-native-keychain-10.0.1-rc.1.tgz
```

**yarn**

```bash
yarn add @react-native-ohos/react-native-keychain
```

## Link

|         | Is supported autolink  | Supported RN Version             |
|---------|--|----------------------------------|
| ~10.0.1 |  Yes              | 0.86 / 0.84 / 0.82 / 0.77 / 0.72 |

Using AutoLink need to be configured according to this document, Autolink Framework Guide Documentation: https://gitcode.com/CPF-RN/ohos_react_native/blob/main/docs/en/02-development/02-development-guide/autolinking.md

If the version you use supports Autolink and the project has been connected to Autolink, skip the ManualLink configuration.

<details>
  <summary>ManualLink: this step is a guide to manually configure native dependencies.</summary>

First, use DevEco Studio to open the HarmonyOS project `harmony` in the project directory.

### 1. Adding the overrides Field to oh-package.json5 File in the Root Directory of the Project

```json
{
  ...
  "overrides": {
    "@rnoh/react-native-openharmony" : "./react_native_openharmony"
  }
}
```

### 2. Introducing Native Code

Currently, two methods are available:

Method 1 (recommended): Use the HAR file.

> [!TIP] The HAR file is stored in the `harmony` directory in the installation path of the third-party library.

Open `entry/oh-package.json5` file and add the following dependencies:

```json
"dependencies": {
    "@rnoh/react-native-openharmony": "file:../react_native_openharmony",

    "@react-native-ohos/react-native-keychain": "file:../../node_modules/@react-native-ohos/react-native-keychain/harmony/rn_keychain.har"
}
```

Click the `sync` button in the upper right corner.

Alternatively, run the following instruction on the terminal:

```bash
cd entry
ohpm install
```

Method 2: Directly link to the source code.

> [!TIP] For details, see [Directly Linking Source Code](https://gitcode.com/CPF-RN/usage-docs/blob/master/en/link-source-code.md).

### 3. Configuring CMakeLists and Introducing RNKeychainPackage

Open `entry/src/main/cpp/CMakeLists.txt` and add the following code:

```diff
# RNOH_BEGIN: manual_package_linking_1
+ add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-keychain/src/main/cpp" ./keychain)

# RNOH_END: manual_package_linking_1
...

# RNOH_BEGIN: manual_package_linking_2
+ target_link_libraries(rnoh_app PUBLIC rnoh_keychain)
# RNOH_END: manual_package_linking_2
```

Open `entry/src/main/cpp/PackageProvider.cpp` and add the following code:

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

### 4. Introducing KeychainPackage to ArkTS

Open the `entry/src/main/ets/RNPackagesFactory.ets` file and add the following code:

```diff
import type {RNPackageContext, RNPackage} from '@rnoh/react-native-openharmony/ts';
+ import { KeychainPackage } from '@react-native-ohos/react-native-keychain/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
+   new KeychainPackage(ctx)
  ];
}
```

> [!TIP] This library is a pure TurboModule library and contains no custom native components. Configuration of `buildCustomComponent` and `arkTsComponentNames` is **NOT** required.
</details>

### Running

Click the `sync` button in the upper right corner.

Alternatively, run the following instruction on the terminal:

```bash
cd entry
ohpm install
```

Then build and run the code.

## Constraints

### Compatibility

To use this repository, you need to use the correct React-Native and RNOH versions. In addition, you need to use DevEco Studio and the ROM on your phone.

Verified in the following versions:

1. RNOH: 0.84.1; SDK: HarmonyOS 6.0.1 Release SDK (API 21);

> [!TIP] The `accessControl` authentication flow (fingerprint/face/lock-screen PIN dialog) must be verified on a real device; biometric capabilities are limited on the emulator.

## Example

The code below shows the basic usage of this library:

> [!WARNING] The HarmonyOS adapter is published as `@react-native-ohos/react-native-keychain`; the JS API is fully compatible with the upstream library.

```js
import * as Keychain from '@react-native-ohos/react-native-keychain';

// Plain store and read
await Keychain.setGenericPassword('username', 'password', {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
});
const credentials = await Keychain.getGenericPassword();
if (credentials) {
  console.log(credentials.username, credentials.password);
}

// Authentication-protected storage: reading requires fingerprint/face/PIN
await Keychain.setGenericPassword('username', 'password', {
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
});
const authed = await Keychain.getGenericPassword({
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
  authenticationPrompt: { title: 'Authenticate to read the password' },
});

// Reset when no longer needed
await Keychain.resetGenericPassword();
```

For the complete example, see `rn-tester/examples/react-native-keychain/` in this repository (covers all accessible / accessControl / securityLevel / authenticationType / cloudSync options and delayed lock-screen semantics verification).

## How to Use

> [!TIP] The **Platform** column indicates the platform where the API is supported in the original third-party library.

> [!TIP] If the value of **OpenHarmony Support** is **yes**, it means that the OpenHarmony platform supports this API; **no** means the opposite; **partially** means some capabilities of this API are supported. The usage method is the same on different platforms and the effect is the same as that of iOS or Android.

For details, see the [keychain official document](https://github.com/oblador/react-native-keychain).

### API

#### Generic Password

| Name                               | Description                                                  | Type     | Required | Platform | OpenHarmony Support |
| ---------------------------------- | ------------------------------------------------------------ | -------- | -------- | -------- | ----------------- |
| `setGenericPassword(username, password, options?)` | Stores/updates generic credentials; an existing service is overwritten. Returns the stored result. | function | Yes | All | yes |
| `getGenericPassword(options?)` | Reads generic credentials; returns `false` if nothing is stored (aligned with the upstream contract). Forces user authentication on every read when `accessControl` is set in options. | function | Yes | All | yes |
| `hasGenericPassword(options?)` | Checks whether generic credentials have been stored. | function | Yes | All | yes |
| `resetGenericPassword(options?)` | Removes generic credentials. | function | Yes | All | yes |
| `getAllGenericPasswordServices(options?)` | Returns the list of services of all stored generic credentials. | function | Yes | iOS, Android | yes |

#### Internet Credentials

| Name                               | Description                                                  | Type     | Required | Platform | OpenHarmony Support |
| ---------------------------------- | ------------------------------------------------------------ | -------- | -------- | -------- | ----------------- |
| `setInternetCredentials(server, username, password, options?)` | Stores internet credentials identified by `server`. | function | Yes | All | yes |
| `getInternetCredentials(server, options?)` | Reads internet credentials of the given `server`; returns `false` if nothing is stored. | function | Yes | All | yes |
| `hasInternetCredentials({ server })` | Checks whether credentials have been stored for the given `server`. | function | Yes | All | yes |
| `resetInternetCredentials({ server })` | Removes internet credentials of the given `server`. | function | Yes | All | yes |

#### Device Capabilities

| Name                               | Description                                                  | Type     | Required | Platform | OpenHarmony Support |
| ---------------------------------- | ------------------------------------------------------------ | -------- | -------- | -------- | ----------------- |
| `getSupportedBiometryType()` | Returns the biometry type supported by the device, or `null` if none. | function | Yes | iOS, Android | yes |
| `canImplyAuthentication(options?)` | Determines whether the device is capable of authentication (respects `options.authenticationType`). | function | Yes | iOS, Android | yes |
| `getSecurityLevel(options?)` | Returns whether the device can securely store credentials and at which level, or `null` if unavailable. | function | Yes | iOS, Android | yes |
| `isPasscodeAuthAvailable()` | Determines whether the lock-screen PIN is available. | function | Yes | iOS, Android | yes |

#### Shared Web Credentials

| Name                               | Description                                                  | Type     | Required | Platform | OpenHarmony Support |
| ---------------------------------- | ------------------------------------------------------------ | -------- | -------- | -------- | ----------------- |
| `requestSharedWebCredentials()` | Requests shared web credentials. | function | Yes | iOS | no  |
| `setSharedWebCredentials(server, username, password?)` | Stores shared web credentials. | function | Yes | iOS | no |

### Options

| Name                                            | Description                                                  | Type     | Required | Platform                | OpenHarmony Support |
| ----------------------------------------------- | ------------------------------------------------------------ | -------- | -------- | ----------------------- |-------------------|
| `service?` | Custom service name; defaults to the app bundle name when omitted. | string | No | All | yes |
| `server?` | Server identifier for internet credentials (internet credentials only). | string | No | All | yes |
| `accessible?` | When the credential is accessible; defaults to `AFTER_FIRST_UNLOCK`. | ACCESSIBLE | No | All | yes |
| `accessControl?` | Requires user authentication (PIN/face/fingerprint) to read credentials. | ACCESS_CONTROL | No | iOS, Android | partially (`APPLICATION_PASSWORD` is unsupported) |
| `authenticationPrompt?` | Texts of the authentication dialog. | object | No | iOS, Android | partially (only `title` takes effect; `subtitle`, `description` and `cancel` are unsupported) |
| `authenticationType?` | Biometric authentication type; affects the probing scope of `canImplyAuthentication`. | AUTHENTICATION_TYPE | No | iOS, Android | yes |
| `securityLevel?` | Required storage security level. | SECURITY_LEVEL | No | Android | no |
| `cloudSync?` | Marks the credential to be synced to user-authorized trusted devices on write. | boolean | No | iOS | no |

### Enums

| Name                               | Description                                                  | Values | OpenHarmony Support |
| ---------------------------------- | ------------------------------------------------------------ | -------- | ----------------- |
| `ACCESSIBLE` | When the credential is accessible | `WHEN_UNLOCKED` / `AFTER_FIRST_UNLOCK` / `ALWAYS` / `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` / `WHEN_UNLOCKED_THIS_DEVICE_ONLY` / `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` | yes |
| `ACCESS_CONTROL` | Access control policy | `USER_PRESENCE` / `BIOMETRY_ANY` / `BIOMETRY_CURRENT_SET` / `DEVICE_PASSCODE` / `APPLICATION_PASSWORD` / `BIOMETRY_ANY_OR_DEVICE_PASSCODE` / `BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE` | partially (all supported except `APPLICATION_PASSWORD`) |
| `AUTHENTICATION_TYPE` | Authentication type | `DEVICE_PASSCODE_OR_BIOMETRICS` / `BIOMETRICS` | yes (affects `canImplyAuthentication`; the authentication type on write is always ANY) |
| `BIOMETRY_TYPE` | Biometry type | `FINGERPRINT` / `FACE` / `IRIS` / `TOUCH_ID` / `FACE_ID` / `OPTIC_ID` | partially (supported: `FINGERPRINT`/`FACE`; unsupported: `IRIS`/`TOUCH_ID`/`FACE_ID`/`OPTIC_ID`) |
| `SECURITY_LEVEL` | Storage security level | `SECURE_SOFTWARE` / `SECURE_HARDWARE` / `ANY` | partially (supported: `SECURE_SOFTWARE`; unsupported: `SECURE_HARDWARE` / `ANY`) |
| `ERROR_CODE` | Error codes (aligned with upstream) | `E_PASSCODE_NOT_SET` / `E_BIOMETRIC_NOT_ENROLLED` / `E_BIOMETRIC_TIMEOUT` / `E_BIOMETRIC_LOCKOUT` / `E_BIOMETRIC_LOCKOUT_PERMANENT` / `E_BIOMETRIC_TEMPORARILY_UNAVAILABLE` / `E_BIOMETRIC_UNAVAILABLE` / `E_BIOMETRIC_VENDOR_ERROR` / `E_AUTH_INTERACTION_NOT_ALLOWED` / `E_AUTH_INVALIDATED` / `E_AUTH_CANCELED` / `E_AUTH_ERROR` / `E_INVALID_PARAMETERS` / `E_STORAGE_ACCESS_ERROR` / `E_INTERNAL_ERROR` | yes (returned as `error.code`, restored from the message prefix by the JS layer) |
| `STORAGE_TYPE` | Encryption algorithm | `AES_CBC` / `AES_GCM_NO_AUTH` / `AES_GCM` / `RSA` | no |

## Known Issues

- [ ] `getSecurityLevel` is implemented but always returns `SECURE_SOFTWARE` and cannot distinguish `SECURE_HARDWARE`/`SECURE_SOFTWARE` like upstream Android (no public API exposes the key security environment, so no hardware-level promise is made)
- [ ] `ACCESS_CONTROL.APPLICATION_PASSWORD` is unsupported
- [ ] `STORAGE_TYPE`: encryption is provided by the Asset Store Kit system-level encryption; selecting a custom algorithm is unsupported
- [ ] `requestSharedWebCredentials` is an iOS-only capability and is unsupported on HarmonyOS
- [ ] `setSharedWebCredentials` is an iOS-only capability and is unsupported on HarmonyOS
- [ ] `SECURE_HARDWARE` and `ANY` of `securityLevel` are unsupported; the HarmonyOS asset store has no level-tiering API
- [ ] Only `title` of `authenticationPrompt` takes effect; `subtitle`, `description` and `cancel` are unsupported on HarmonyOS
- [ ] `Options.cloudSync` is unsupported on HarmonyOS
- [ ] `IRIS` of the `BIOMETRY_TYPE` enum is unsupported on HarmonyOS (the public SDK's UserAuthType has no iris type)

## Others

## Directory Structure

````
/rntpc_react-native-keychain                            # RNOH third-party library verification project (rn-tester)
├── package.json                                        # JS dependencies (keychain introduced as a tgz)
├── rnoh_package/                                       # Directory holding third-party tgz packages
├── node_modules/@react-native-ohos/react-native-keychain/  # JS package (npm install output)
│   ├── CHANGELOG.md                                    # Version changelog
│   ├── LICENSE.md                                      # MIT license
│   ├── package.json                                    # npm package info (harmony autolinking/codegen config)
│   ├── harmony/
│   │   └── rn_keychain.har                             # HarmonyOS HAR artifact (what the app actually compiles against)
│   └── src/                                            # JS/TS source directory
│       ├── index.ts                                    # Library entry (15 public functions + error.code restoration)
│       ├── enums.ts                                    # Enum definitions (ACCESSIBLE/ACCESS_CONTROL/ERROR_CODE, etc.)
│       ├── types.ts                                    # Type definitions (Options/UserCredentials, etc.)
│       ├── normalizeOptions.ts                         # Options normalization (passes through accessControl/server, etc.)
│       └── NativeKeychainManager.ts                    # TurboModule Codegen interface spec
├── harmony/                                            # HarmonyOS app project
│   ├── rn_keychain/                                    # HAR source (where this document lives)
│   │   ├── index.ets                                   # Module entry (default export KeychainPackage)
│   │   ├── ts.ets                                      # Package type export entry
│   │   ├── oh-package.json5                            # HAR package config
│   │   ├── build-profile.json5 / hvigorfile.ts         # Hvigor build configuration
│   │   └── src/main/
│   │       ├── module.json5                            # Module manifest (declares the ACCESS_BIOMETRIC permission)
│   │       ├── ets/                                    # ArkTS native implementation
│   │       │   ├── KeychainPackage.ets                 # Package registration (registers the TurboModule with RNOH)
│   │       │   ├── KeychainTurboModule.ets             # TurboModule core (asset read/write, user auth, error mapping)
│   │       │   ├── Logger.ets                          # Logging utility
│   │       │   └── generated/                          # Codegen-generated ArkTS code
│   │       ├── cpp/                                    # C++ side implementation
│   │       │   ├── CMakeLists.txt                      # C++ build config (target rnoh_keychain)
│   │       │   ├── RNKeychainPackage.h                 # C++ package registration header
│   │       │   └── generated/                          # Codegen-generated C++ code
│   │       └── resources/                              # Resources
│   └── entry/                                          # Host app (wiring see the ManualLink section)
└── rn-tester/examples/react-native-keychain/           # Feature verification demo
    ├── Index.tsx                                       # All APIs + option chips + delayed lock-screen verification
    └── tests/KeychainTest.tsx                          # 30+ unit/integration test cases
````

## How to Contribute

If you encounter any problems during use, you can submit an [Issue](https://github.com/react-native-oh-library/react-native-keychain/issues). Of course, submitting a [PR](https://github.com/react-native-oh-library/react-native-keychain/pulls) is also very welcome.

## License

This project is licensed under [The MIT License (MIT)](https://github.com/oblador/react-native-keychain/blob/master/LICENSE.md).

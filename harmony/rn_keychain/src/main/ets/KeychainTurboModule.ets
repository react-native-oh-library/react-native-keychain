/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Joel Arvidsson
 * Copyright (c) 2025 React Native OpenHarmony contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * HarmonyOS adaptation of react-native-keychain (RNKeychainManager TurboModule).
 *
 * All credentials are persisted through the HarmonyOS Asset Store Kit
 * (`@ohos.security.asset`), which stores secrets encrypted by the system
 * service. No plaintext credential is ever written to disk by this module:
 * both `username` and `password` are serialized into a single JSON envelope
 * that is passed as the asset SECRET (system-encrypted at rest).
 *
 * 对标上游 src/NativeKeychainManager.ts 契约:
 * - 未存凭据时 get 返回 false(非 null),与 Android/iOS 一致
 * - ACCESS_CONTROL 选项:写入时挂 AUTH_TYPE.ANY,读取时走系统认证弹窗
 * - 错误码以 "E_XXX: 信息" 前缀置于 message(JS 包装层还原为 error.code)
 */

import { asset } from '@kit.AssetStoreKit';
import { userAuth } from '@kit.UserAuthenticationKit';
import { cryptoFramework } from '@kit.CryptoArchitectureKit';
import { util } from '@kit.ArkTS';
import { BusinessError } from '@kit.BasicServicesKit';
import type { UITurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { UITurboModule } from '@rnoh/react-native-openharmony/ts';
import { RNKeychainManager } from './generated/turboModules/RNKeychainManager';
import Logger from './Logger';

const TAG = 'KeychainTurboModule';

/** 错误码与上游 src/enums.ts 的 ERROR_CODE 对齐 */
interface ErrorCodeTable {
  readonly PASSCODE_NOT_SET: string;
  readonly BIOMETRIC_NOT_ENROLLED: string;
  readonly BIOMETRIC_TIMEOUT: string;
  readonly BIOMETRIC_LOCKOUT: string;
  readonly BIOMETRIC_UNAVAILABLE: string;
  readonly AUTH_CANCELED: string;
  readonly AUTH_ERROR: string;
  readonly INVALID_PARAMETERS: string;
  readonly STORAGE_ACCESS_ERROR: string;
  readonly INTERNAL_ERROR: string;
}

const ERROR_CODE: ErrorCodeTable = {
  PASSCODE_NOT_SET: 'E_PASSCODE_NOT_SET',
  BIOMETRIC_NOT_ENROLLED: 'E_BIOMETRIC_NOT_ENROLLED',
  BIOMETRIC_TIMEOUT: 'E_BIOMETRIC_TIMEOUT',
  BIOMETRIC_LOCKOUT: 'E_BIOMETRIC_LOCKOUT',
  BIOMETRIC_UNAVAILABLE: 'E_BIOMETRIC_UNAVAILABLE',
  AUTH_CANCELED: 'E_AUTH_CANCELED',
  AUTH_ERROR: 'E_AUTH_ERROR',
  INVALID_PARAMETERS: 'E_INVALID_PARAMETERS',
  STORAGE_ACCESS_ERROR: 'E_STORAGE_ACCESS_ERROR',
  INTERNAL_ERROR: 'E_INTERNAL_ERROR',
};

/**
 * reject 载荷。RNOH 0.84 桥只透传 reject 值的 message 字段(见
 * ArkTSTurboModule.cpp preparePromiseRejectionResult),因此错误码以
 * "E_XXX: 原始信息" 前缀内嵌于 message,由 JS 包装层还原为 error.code。
 */
class KeychainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.code = code;
  }
}

/** 以 JSON 信封存入 asset SECRET,用户名一并被系统加密 */
interface CredentialPayload {
  u: string;
  p: string;
}

interface KeychainResult {
  service: string;
  storage: string;
  username: string;
  password: string;
}

type CredentialKind = 'generic' | 'internet';

/** Asset Store Kit 约束(见 js-apis-asset) */
const ASSET_ALIAS_MAX_BYTES = 256;
const ASSET_SECRET_MAX_BYTES = 1024;
const ASSET_LABEL_MAX_BYTES = 512;

const ALIAS_PREFIX_GENERIC = 'rnkc_g_';
const ALIAS_PREFIX_INTERNET = 'rnkc_i_';

/** kind 标记存于 DATA_LABEL_NORMAL_3,service/server 存于 DATA_LABEL_NORMAL_2 */
const KIND_LABEL_GENERIC = 'generic';
const KIND_LABEL_INTERNET = 'internet';

const STORAGE_NAME = 'AssetStore';

/** JS 层通常已注入默认值,此处兜底 */
const DEFAULT_AUTH_TITLE = 'Authenticate to retrieve secret';

/** Asset Store Kit 错误码 */
const ASSET_ERR_NOT_FOUND = 24000002;
const ASSET_ERR_ACCESS_DENIED = 24000004;
/** 设备锁屏密码设置状态与资产要求不匹配(如 REQUIRE_PASSWORD_SET 时设备无锁屏密码) */
const ASSET_ERR_SCREEN_LOCK_MISMATCH = 24000005;
/** 参数错误;对 AUTH_TYPE 资产的普通 query 表现为"缺少 AUTH_CHALLENGE" */
const ASSET_ERR_INVALID_ARGUMENT = 401;

/** userIAM 结果码 */
const USER_AUTH_SUCCESS = 12500000;
const USER_AUTH_FAIL = 12500001;
const USER_AUTH_CANCELED = 12500003;
const USER_AUTH_TIMEOUT = 12500004;
const USER_AUTH_TYPE_NOT_SUPPORT = 12500005;
const USER_AUTH_LOCKED = 12500009;
const USER_AUTH_NOT_ENROLLED = 12500010;
const USER_AUTH_PIN_EXPIRED = 12500013;

/** 上游 ACCESSIBLE 枚举取值(src/enums.ts) */
const ACCESSIBLE_WHEN_UNLOCKED = 'AccessibleWhenUnlocked';
const ACCESSIBLE_WHEN_UNLOCKED_THIS_DEVICE_ONLY = 'AccessibleWhenUnlockedThisDeviceOnly';
const ACCESSIBLE_ALWAYS = 'AccessibleAlways';
const ACCESSIBLE_WHEN_PASSCODE_SET = 'AccessibleWhenPasscodeSetThisDeviceOnly';
const ACCESSIBLE_AFTER_FIRST_UNLOCK = 'AccessibleAfterFirstUnlock';
const ACCESSIBLE_AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 'AccessibleAfterFirstUnlockThisDeviceOnly';

/** 关键资产无对应能力,需直接报参数错误 */
const ACCESS_CONTROL_APPLICATION_PASSWORD = 'ApplicationPassword';

type OptionValue = string | boolean | AuthenticationPromptValue;

interface AuthenticationPromptValue {
  title?: string;
  subtitle?: string;
  description?: string;
  cancel?: string;
}

export class KeychainTurboModule extends UITurboModule implements RNKeychainManager.Spec {
  private textEncoder: util.TextEncoder = new util.TextEncoder();
  private textDecoder: util.TextDecoder = util.TextDecoder.create('utf-8', {
    ignoreBOM: true,
  });

  constructor(ctx: UITurboModuleContext) {
    super(ctx);
  }

  // ==================== Generic Password ====================

  async setGenericPasswordForOptions(options: null | Object, username: string,
    password: string): Promise<null | Object> {
    const opts = this.asRecord(options);
    const service = this.resolveService(opts);
    return this.writeCredentials('generic', service, username, password, opts);
  }

  async getGenericPasswordForOptions(options: null | Object): Promise<null | Object> {
    const opts = this.asRecord(options);
    const service = this.resolveService(opts);
    return this.readCredentials('generic', service, opts);
  }

  async hasGenericPasswordForOptions(options: null | Object): Promise<boolean> {
    const opts = this.asRecord(options);
    return this.hasCredentials('generic', this.resolveService(opts));
  }

  async resetGenericPasswordForOptions(options: null | Object): Promise<boolean> {
    const opts = this.asRecord(options);
    return this.removeCredentials('generic', this.resolveService(opts));
  }

  async getAllGenericPasswordServices(options: null | Object): Promise<string[]> {
    const query: asset.AssetMap = new Map();
    query.set(asset.Tag.RETURN_TYPE, asset.ReturnType.ATTRIBUTES);
    query.set(asset.Tag.DATA_LABEL_NORMAL_3, this.stringToBytes(KIND_LABEL_GENERIC));
    let results: Array<asset.AssetMap> = [];
    try {
      results = await asset.query(query);
    } catch (error) {
      const err = error as BusinessError;
      if (err?.code === ASSET_ERR_NOT_FOUND) {
        return [];
      }
      throw this.mapAssetError(err, 'getAllGenericPasswordServices');
    }
    const services: string[] = [];
    for (const result of results) {
      const service = this.labelToString(result, asset.Tag.DATA_LABEL_NORMAL_2);
      if (service !== undefined) {
        services.push(service);
      }
    }
    return services;
  }

  // ==================== Internet Credentials ====================

  async setInternetCredentialsForServer(server: string, username: string, password: string,
    options: null | Object): Promise<null | Object> {
    if (this.isBlank(server)) {
      throw this.invalidParameters('server must be a non-empty string');
    }
    return this.writeCredentials('internet', server, username, password, this.asRecord(options));
  }

  async getInternetCredentialsForServer(server: string,
    options: null | Object): Promise<null | Object> {
    if (this.isBlank(server)) {
      throw this.invalidParameters('server must be a non-empty string');
    }
    return this.readCredentials('internet', server, this.asRecord(options));
  }

  async hasInternetCredentialsForOptions(options: Object): Promise<boolean> {
    const server = this.readString(this.asRecord(options), 'server');
    if (server === undefined || this.isBlank(server)) {
      throw this.invalidParameters('server must be a non-empty string');
    }
    return this.hasCredentials('internet', server);
  }

  async resetInternetCredentialsForOptions(options: Object): Promise<void> {
    const server = this.readString(this.asRecord(options), 'server');
    if (server === undefined || this.isBlank(server)) {
      throw this.invalidParameters('server must be a non-empty string');
    }
    await this.removeCredentials('internet', server);
  }

  // ==================== Device capabilities ====================

  // 缺失 IRIS_SUPPORTED_NAME 能力,鸿蒙不支持虹膜
  async getSupportedBiometryType(): Promise<null | string> {
    if (this.isUserAuthTypeAvailable(userAuth.UserAuthType.FINGERPRINT)) {
      return 'Fingerprint';
    }
    if (this.isUserAuthTypeAvailable(userAuth.UserAuthType.FACE)) {
      return 'Face';
    }
    return null;
  }

  async canCheckAuthentication(options: null | Object): Promise<boolean> {
    // 与上游 AUTHENTICATION_TYPE 对齐:
    // BIOMETRICS 仅探测生物识别;DEVICE_PASSCODE_OR_BIOMETRICS(默认)额外含锁屏密码
    const opts = this.asRecord(options);
    let types: userAuth.UserAuthType[];
    if (this.readString(opts, 'authenticationType') === 'AuthenticationWithBiometrics') {
      types = [userAuth.UserAuthType.FINGERPRINT, userAuth.UserAuthType.FACE];
    } else {
      types = [
        userAuth.UserAuthType.PIN,
        userAuth.UserAuthType.FINGERPRINT,
        userAuth.UserAuthType.FACE,
      ];
    }
    for (const type of types) {
      if (this.isUserAuthTypeAvailable(type)) {
        return true;
      }
    }
    return false;
  }

  async getSecurityLevel(options: null | Object): Promise<null | string> {
    // 关键资产由系统服务加密,密钥系统托管且不出安全环境;
    // 华为未承诺所有设备密钥均在 TEE,按上游 Android 语义仅承诺软件级
    return 'SECURE_SOFTWARE';
  }

  async isPasscodeAuthAvailable(): Promise<boolean> {
    return this.isUserAuthTypeAvailable(userAuth.UserAuthType.PIN);
  }

  // ==================== iOS-only(鸿蒙不支持,直接 reject) ====================

  async requestSharedWebCredentials(): Promise<null | Object> {
    throw new KeychainError(
      ERROR_CODE.INTERNAL_ERROR,
      'requestSharedWebCredentials is not supported on ohos'
    );
  }

  async setSharedWebCredentialsForServer(server: string, username: string,
    password: string): Promise<void> {
    throw new KeychainError(
      ERROR_CODE.INTERNAL_ERROR,
      'setSharedWebCredentials is not supported on ohos'
    );
  }

  // ==================== Asset Store Kit 封装 ====================

  private async writeCredentials(kind: CredentialKind, key: string, username: string,
    password: string, opts: Record<string, OptionValue>): Promise<Object> {
    if (this.isBlank(username) || this.isBlank(password)) {
      throw this.invalidParameters('you passed empty or null username/password');
    }
    const payload: CredentialPayload = { u: username, p: password };
    const secret = this.stringToBytes(JSON.stringify(payload));
    if (secret.length < 1 || secret.length > ASSET_SECRET_MAX_BYTES) {
      throw this.invalidParameters(
        'username and password are too long (the asset SECRET is limited to 1024 bytes)'
      );
    }
    const alias = this.computeAlias(kind, key);
    const keyLabel = this.stringToBytes(key);
    if (keyLabel.length > ASSET_LABEL_MAX_BYTES) {
      throw this.invalidParameters('service/server is too long');
    }

    const accessControl = this.readString(opts, 'accessControl');
    if (accessControl === ACCESS_CONTROL_APPLICATION_PASSWORD) {
      throw this.invalidParameters(
        'ACCESS_CONTROL.APPLICATION_PASSWORD is not supported on ohos'
      );
    }

    const accessible = this.readString(opts, 'accessible');
    const attrs: asset.AssetMap = new Map();
    attrs.set(asset.Tag.ALIAS, alias);
    attrs.set(asset.Tag.SECRET, secret);
    attrs.set(asset.Tag.ACCESSIBILITY, this.mapAccessible(accessible));
    if (accessible === ACCESSIBLE_WHEN_PASSCODE_SET) {
      // 上游语义:仅在设备设置了锁屏密码时才允许写入
      attrs.set(asset.Tag.REQUIRE_PASSWORD_SET, true);
    }
    if (accessControl !== undefined) {
      // 生物识别/密码类访问控制统一映射为"任意用户认证"(PIN/人脸/指纹)
      attrs.set(asset.Tag.AUTH_TYPE, asset.AuthType.ANY);
    }
    attrs.set(asset.Tag.DATA_LABEL_NORMAL_2, keyLabel);
    attrs.set(asset.Tag.DATA_LABEL_NORMAL_3,
      this.stringToBytes(kind === 'generic' ? KIND_LABEL_GENERIC : KIND_LABEL_INTERNET));
    if (opts['cloudSync'] === true) {
      // 关键资产同步到用户授权的受信设备(SyncType 无 ALWAYS,可选 NEVER/THIS_DEVICE/TRUSTED_DEVICE)
      attrs.set(asset.Tag.SYNC_TYPE, asset.SyncType.TRUSTED_DEVICE);
    }

    // 先删后增,对齐 iOS SecItemDelete + SecItemAdd 语义
    try {
      await asset.remove(this.aliasQuery(alias));
    } catch (error) {
      const err = error as BusinessError;
      if (err?.code !== ASSET_ERR_NOT_FOUND) {
        throw this.mapAssetError(err, 'writeCredentials');
      }
    }
    try {
      await asset.add(attrs);
    } catch (error) {
      throw this.mapAssetError(error as BusinessError, 'writeCredentials');
    }

    const result: KeychainResult = {
      service: key,
      storage: STORAGE_NAME,
      username: username,
      password: password,
    };
    return result;
  }

  private async readCredentials(kind: CredentialKind, key: string,
    opts: Record<string, OptionValue>): Promise<boolean | Object> {
    const alias = this.computeAlias(kind, key);
    let results: Array<asset.AssetMap>;
    if (this.readString(opts, 'accessControl') !== undefined) {
      // 带 AUTH_TYPE 的资产,普通 query(ReturnType=ALL)会被服务直接拒绝:
      // 返回 ACCESS_DENIED 或 401"缺少 AUTH_CHALLENGE"(API21 实测);且认证通过后
      // 系统存在免认证缓存,短时间内普通 query 可能直接返回数据。
      // 因此读取 options 带 accessControl 时,每次都强制走完整认证流程,对齐上游语义
      const authenticated = await this.querySecretWithUserAuth(alias, opts);
      if (authenticated === null) {
        return false;
      }
      results = authenticated;
    } else {
      try {
        results = await this.querySecret(alias);
      } catch (error) {
        const err = error as BusinessError;
        if (err?.code === ASSET_ERR_NOT_FOUND) {
          // 上游契约:未存过返回 false
          return false;
        }
        if (err?.code === ASSET_ERR_ACCESS_DENIED || err?.code === ASSET_ERR_INVALID_ARGUMENT) {
          // 资产写入时带了 accessControl(AUTH_TYPE.ANY),本次读取未声明 accessControl:
          // 服务要求 AUTH_CHALLENGE,普通 query 必然被拒(querySecret 参数恒定,
          // 401 只可能是该规则触发),对齐上游 errSecInteractionNotAllowed 语义直接失败
          throw new KeychainError(
            ERROR_CODE.AUTH_ERROR,
            'Credential is protected by user authentication; pass accessControl to authenticate'
          );
        }
        throw this.mapAssetError(err, 'readCredentials');
      }
    }
    if (results.length === 0) {
      return false;
    }
    const secretBytes = results[0].get(asset.Tag.SECRET) as Uint8Array;
    const payload = this.parsePayload(secretBytes);
    const service = this.labelToString(results[0], asset.Tag.DATA_LABEL_NORMAL_2) ?? key;
    const result: KeychainResult = {
      service,
      storage: STORAGE_NAME,
      username: payload.u,
      password: payload.p,
    };
    return result;
  }

  private async hasCredentials(kind: CredentialKind, key: string): Promise<boolean> {
    const query: asset.AssetMap = new Map();
    query.set(asset.Tag.ALIAS, this.computeAlias(kind, key));
    // ATTRIBUTES 不解密 SECRET,存在性检查不会触发认证弹窗
    query.set(asset.Tag.RETURN_TYPE, asset.ReturnType.ATTRIBUTES);
    try {
      await asset.query(query);
      return true;
    } catch (error) {
      const err = error as BusinessError;
      if (err?.code === ASSET_ERR_NOT_FOUND) {
        return false;
      }
      if (err?.code === ASSET_ERR_ACCESS_DENIED) {
        // 凭据存在但受用户认证保护
        return true;
      }
      throw this.mapAssetError(err, 'hasCredentials');
    }
  }

  private async removeCredentials(kind: CredentialKind, key: string): Promise<boolean> {
    try {
      await asset.remove(this.aliasQuery(this.computeAlias(kind, key)));
    } catch (error) {
      const err = error as BusinessError;
      if (err?.code !== ASSET_ERR_NOT_FOUND) {
        throw this.mapAssetError(err, 'removeCredentials');
      }
      // 幂等:不存在视为删除成功(与 iOS/Android 行为一致)
    }
    return true;
  }

  /** 普通查询,返回解密后的 SECRET */
  private querySecret(alias: Uint8Array): Promise<Array<asset.AssetMap>> {
    const query: asset.AssetMap = new Map();
    query.set(asset.Tag.ALIAS, alias);
    query.set(asset.Tag.RETURN_TYPE, asset.ReturnType.ALL);
    return asset.query(query);
  }

  /**
   * 读取受用户认证保护的关键资产,按官方流程:
   * preQuery -> userIAM 认证弹窗 -> query(AUTH_TOKEN) -> postQuery。
   */
  private async querySecretWithUserAuth(alias: Uint8Array,
    opts: Record<string, OptionValue>): Promise<Array<asset.AssetMap> | null> {
    let challenge: Uint8Array;
    try {
      challenge = await asset.preQuery(this.aliasQuery(alias));
    } catch (error) {
      const err = error as BusinessError;
      if (err?.code === ASSET_ERR_NOT_FOUND) {
        return null;
      }
      throw this.mapAssetError(err, 'preQuery');
    }

    try {
      const authToken = await this.authenticateWithUserAuth(challenge, opts);
      const query: asset.AssetMap = new Map();
      query.set(asset.Tag.ALIAS, alias);
      query.set(asset.Tag.RETURN_TYPE, asset.ReturnType.ALL);
      query.set(asset.Tag.AUTH_CHALLENGE, challenge);
      query.set(asset.Tag.AUTH_TOKEN, authToken);
      return await asset.query(query);
    } finally {
      // preQuery 成功后必须调用 postQuery
      const handle: asset.AssetMap = new Map();
      handle.set(asset.Tag.AUTH_CHALLENGE, challenge);
      asset.postQuery(handle).catch((error: BusinessError) => {
        Logger.warn(TAG, `postQuery failed, code=${error?.code}`);
      });
    }
  }

  /** 拉起系统认证弹窗,认证成功后返回 token */
  private authenticateWithUserAuth(challenge: Uint8Array,
    opts: Record<string, OptionValue>): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const prompt = this.readAuthenticationPrompt(opts);
      const authParam: userAuth.AuthParam = {
        challenge: challenge,
        authType: [
          userAuth.UserAuthType.PIN,
          userAuth.UserAuthType.FACE,
          userAuth.UserAuthType.FINGERPRINT,
        ],
        authTrustLevel: userAuth.AuthTrustLevel.ATL1,
      };
      const widgetParam: userAuth.WidgetParam = {
        title: prompt,
      };
      try {
        const authInstance = userAuth.getUserAuthInstance(authParam, widgetParam);
        authInstance.on('result', {
          onResult: (result: userAuth.UserAuthResult) => {
            if (result.result === USER_AUTH_SUCCESS) {
              if (result.token !== undefined && result.token !== null) {
                Logger.info(TAG, 'user authentication succeeded');
                resolve(result.token);
              } else {
                reject(new KeychainError(
                  ERROR_CODE.AUTH_ERROR,
                  'User authentication succeeded but no token was returned'
                ));
              }
            } else {
              Logger.warn(TAG, `user authentication failed, result=${result.result}`);
              reject(this.mapUserAuthResult(result.result));
            }
          },
        });
        authInstance.start();
      } catch (error) {
        const err = error as BusinessError;
        if (err?.code === 401) {
          reject(this.invalidParameters('Invalid user authentication parameters'));
        } else if (err?.code !== undefined && err.code >= USER_AUTH_FAIL && err.code < 12600000) {
          reject(this.mapUserAuthResult(err.code));
        } else {
          reject(this.mapAssetError(err, 'authenticateWithUserAuth'));
        }
      }
    });
  }

  private isUserAuthTypeAvailable(authType: userAuth.UserAuthType): boolean {
    try {
      // ATL1 即可判断可用性,ATL4 会因信任等级不足误报不可用
      userAuth.getAvailableStatus(authType, userAuth.AuthTrustLevel.ATL1);
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==================== 映射辅助 ====================

  /** 上游 ACCESSIBLE -> 关键资产可访问性,默认 AFTER_FIRST_UNLOCK(与上游默认一致) */
  private mapAccessible(accessible: string | undefined): asset.Accessibility {
    switch (accessible) {
      case ACCESSIBLE_WHEN_UNLOCKED:
      case ACCESSIBLE_WHEN_UNLOCKED_THIS_DEVICE_ONLY:
      // WHEN_PASSCODE_SET_THIS_DEVICE_ONLY:仅解锁状态可读;"要求已设锁屏密码"
      // 由 writeCredentials 另挂 REQUIRE_PASSWORD_SET 实现
      case ACCESSIBLE_WHEN_PASSCODE_SET:
        return asset.Accessibility.DEVICE_UNLOCKED;
      case ACCESSIBLE_ALWAYS:
        return asset.Accessibility.DEVICE_POWERED_ON;
      case ACCESSIBLE_AFTER_FIRST_UNLOCK:
      case ACCESSIBLE_AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:
      default:
        return asset.Accessibility.DEVICE_FIRST_UNLOCKED;
    }
  }

  private mapUserAuthResult(result: number): KeychainError {
    switch (result) {
      case USER_AUTH_CANCELED:
        return new KeychainError(ERROR_CODE.AUTH_CANCELED, 'User canceled authentication');
      case USER_AUTH_TIMEOUT:
        return new KeychainError(ERROR_CODE.BIOMETRIC_TIMEOUT, 'Authentication timed out');
      case USER_AUTH_LOCKED:
        return new KeychainError(ERROR_CODE.BIOMETRIC_LOCKOUT, 'Authenticator is locked out');
      case USER_AUTH_NOT_ENROLLED:
        return new KeychainError(ERROR_CODE.BIOMETRIC_NOT_ENROLLED,
          'No biometric credential is enrolled');
      case USER_AUTH_PIN_EXPIRED:
        return new KeychainError(ERROR_CODE.PASSCODE_NOT_SET, 'The lock screen PIN has expired');
      case USER_AUTH_FAIL:
      case USER_AUTH_TYPE_NOT_SUPPORT:
      default:
        return new KeychainError(ERROR_CODE.AUTH_ERROR, `Authentication failed (${result})`);
    }
  }

  private mapAssetError(err: BusinessError, operation: string): KeychainError {
    let code: string = ERROR_CODE.STORAGE_ACCESS_ERROR;
    if (err?.code === 401) {
      code = ERROR_CODE.INVALID_PARAMETERS;
    } else if (err?.code === ASSET_ERR_ACCESS_DENIED) {
      code = ERROR_CODE.AUTH_ERROR;
    } else if (err?.code === ASSET_ERR_SCREEN_LOCK_MISMATCH) {
      // 带 REQUIRE_PASSWORD_SET 写入时设备未设锁屏密码,或写入后锁屏密码被删除
      code = ERROR_CODE.PASSCODE_NOT_SET;
    }
    const detail = err?.code !== undefined
      ? `code=${err.code}, message=${err.message ?? 'unknown'}`
      : String(err);
    Logger.error(TAG, `${operation} failed, ${detail}`);
    return new KeychainError(code, `Asset Store error: ${detail}`);
  }

  private invalidParameters(message: string): KeychainError {
    return new KeychainError(ERROR_CODE.INVALID_PARAMETERS, message);
  }

  // ==================== Options 辅助 ====================

  private asRecord(options: null | Object): Record<string, OptionValue> {
    if (options === null || options === undefined) {
      return {};
    }
    return options as Record<string, OptionValue>;
  }

  private resolveService(opts: Record<string, OptionValue>): string {
    const service = this.readString(opts, 'service');
    if (service !== undefined && !this.isBlank(service)) {
      return service;
    }
    // iOS 回退到主 bundle id,鸿蒙对应应用包名
    try {
      const bundleName = this.ctx.uiAbilityContext.abilityInfo.bundleName;
      if (!this.isBlank(bundleName)) {
        return bundleName;
      }
    } catch (e) {
      Logger.warn(TAG, 'failed to get bundle name, fallback to default');
    }
    return 'com.rnoh.default';
  }

  private readAuthenticationPrompt(opts: Record<string, OptionValue>): string {
    const prompt = opts['authenticationPrompt'] as AuthenticationPromptValue | undefined;
    const title = prompt?.title;
    if (typeof title === 'string' && !this.isBlank(title)) {
      return title;
    }
    return DEFAULT_AUTH_TITLE;
  }

  private readString(record: Record<string, OptionValue> | null | undefined,
    key: string): string | undefined {
    if (record === null || record === undefined) {
      return undefined;
    }
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
    return undefined;
  }

  private isBlank(value: string): boolean {
    return value.trim().length === 0;
  }

  // ==================== 序列化辅助 ====================

  private stringToBytes(value: string): Uint8Array {
    return this.textEncoder.encodeInto(value);
  }

  private bytesToString(value: Uint8Array): string {
    return this.textDecoder.decodeToString(value, { stream: false });
  }

  private labelToString(assetMap: asset.AssetMap, tag: asset.Tag): string | undefined {
    const value = assetMap.get(tag);
    if (value !== undefined && value instanceof Uint8Array) {
      return this.bytesToString(value as Uint8Array);
    }
    return undefined;
  }

  private parsePayload(secret: Uint8Array): CredentialPayload {
    try {
      const parsed = JSON.parse(this.bytesToString(secret)) as Record<string, string>;
      const u = parsed['u'] ?? parsed['username'];
      const p = parsed['p'] ?? parsed['password'];
      if (typeof u === 'string' && typeof p === 'string') {
        const payload: CredentialPayload = { u: u, p: p };
        return payload;
      }
    } catch (error) {
      Logger.error(TAG, 'failed to parse the stored credential payload');
    }
    throw new KeychainError(
      ERROR_CODE.STORAGE_ACCESS_ERROR,
      'Stored credential payload is corrupted'
    );
  }

  /**
   * 生成 kind + service/server 对应的 asset ALIAS。
   * 超过 256 字节的长 key 用 SHA-256 前 12 字节十六进制稳定映射,
   * 配合 DATA_LABEL_NORMAL_2 保存原始 service 供反查。
   */
  private computeAlias(kind: CredentialKind, key: string): Uint8Array {
    const prefix = kind === 'generic' ? ALIAS_PREFIX_GENERIC : ALIAS_PREFIX_INTERNET;
    const plain = this.stringToBytes(`${prefix}${key}`);
    if (plain.length <= ASSET_ALIAS_MAX_BYTES) {
      return plain;
    }
    const md = cryptoFramework.createMd('SHA256');
    md.updateSync({ data: this.stringToBytes(key) });
    const digest = md.digestSync().data;
    let hex = '';
    for (let i = 0; i < 12; i++) {
      const byte = digest[i].toString(16);
      hex += byte.length === 1 ? `0${byte}` : byte;
    }
    return this.stringToBytes(`${prefix}sha_${hex}`);
  }

  private aliasQuery(alias: Uint8Array): asset.AssetMap {
    const query: asset.AssetMap = new Map();
    query.set(asset.Tag.ALIAS, alias);
    return query;
  }
}

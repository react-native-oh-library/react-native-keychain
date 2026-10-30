/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type KeychainManagerMethodMocks = {
  setGenericPasswordForOptions: jest.Mock;
  getGenericPasswordForOptions: jest.Mock;
  hasGenericPasswordForOptions: jest.Mock;
  resetGenericPasswordForOptions: jest.Mock;
  getAllGenericPasswordServices: jest.Mock;
  hasInternetCredentialsForOptions: jest.Mock;
  setInternetCredentialsForServer: jest.Mock;
  getInternetCredentialsForServer: jest.Mock;
  resetInternetCredentialsForOptions: jest.Mock;
  getSupportedBiometryType: jest.Mock;
  canCheckAuthentication: jest.Mock;
  getSecurityLevel: jest.Mock;
  isPasscodeAuthAvailable: jest.Mock;
  requestSharedWebCredentials: jest.Mock;
  setSharedWebCredentialsForServer: jest.Mock;
};

function createMethodMocks(): KeychainManagerMethodMocks {
  return {
    setGenericPasswordForOptions: jest.fn(),
    getGenericPasswordForOptions: jest.fn(),
    hasGenericPasswordForOptions: jest.fn(),
    resetGenericPasswordForOptions: jest.fn(),
    getAllGenericPasswordServices: jest.fn(),
    hasInternetCredentialsForOptions: jest.fn(),
    setInternetCredentialsForServer: jest.fn(),
    getInternetCredentialsForServer: jest.fn(),
    resetInternetCredentialsForOptions: jest.fn(),
    getSupportedBiometryType: jest.fn(),
    canCheckAuthentication: jest.fn(),
    getSecurityLevel: jest.fn(),
    isPasscodeAuthAvailable: jest.fn(),
    requestSharedWebCredentials: jest.fn(),
    setSharedWebCredentialsForServer: jest.fn(),
  };
}

export const nativeKeychainManagerMock: KeychainManagerMethodMocks =
  createMethodMocks();

/**
 * Replaces every method with a fresh jest.fn() while keeping the object
 * identity, so mocks deleted by a test (optional native methods) come back.
 */
export function resetNativeKeychainManagerMock(): void {
  Object.assign(nativeKeychainManagerMock, createMethodMocks());
}

/** Deletes an optional native method to simulate an unsupported platform. */
export function removeNativeMethod(method: string): void {
  delete (nativeKeychainManagerMock as Record<string, unknown>)[method];
}

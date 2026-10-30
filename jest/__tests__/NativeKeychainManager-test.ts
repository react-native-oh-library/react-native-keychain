/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    getEnforcing: jest.fn(() => ({ marker: 'RNKeychainManager turbo module' })),
  },
}));

import { TurboModuleRegistry } from 'react-native';
import NativeKeychainManager from '../../src/NativeKeychainManager';

describe('NativeKeychainManager', () => {
  it('obtains the module via TurboModuleRegistry.getEnforcing at import time', () => {
    const getEnforcing = jest.mocked(TurboModuleRegistry.getEnforcing);
    expect(getEnforcing).toHaveBeenCalledTimes(1);
    expect(getEnforcing).toHaveBeenCalledWith('RNKeychainManager');
  });

  it('exports the turbo module as its default export', () => {
    const getEnforcing = jest.mocked(TurboModuleRegistry.getEnforcing);
    expect(NativeKeychainManager).toBe(getEnforcing.mock.results[0].value);
    expect(NativeKeychainManager).toEqual({
      marker: 'RNKeychainManager turbo module',
    });
  });
});

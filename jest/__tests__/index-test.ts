/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  TurboModuleRegistry: {
    getEnforcing: jest.fn(
      () =>
        require('../helpers/nativeKeychainManagerMock')
          .nativeKeychainManagerMock
    ),
  },
}));

import { Platform } from 'react-native';
import * as Keychain from '../../src';
import KeychainDefault from '../../src';
import {
  nativeKeychainManagerMock,
  resetNativeKeychainManagerMock,
  removeNativeMethod,
} from '../helpers/nativeKeychainManagerMock';
import { AUTH_PROMPT_DEFAULTS } from '../../src/normalizeOptions';

describe('index', () => {
  beforeEach(() => {
    resetNativeKeychainManagerMock();
    (Platform as { OS: string }).OS = 'android';
  });

  describe('setGenericPassword', () => {
    it('normalizes the auth prompt and forwards username and password', async () => {
      nativeKeychainManagerMock.setGenericPasswordForOptions.mockResolvedValue({
        service: 'com.example.app',
        storage: 'KeystoreAESGCM_NoAuth',
      });

      await expect(
        Keychain.setGenericPassword('user', 'pass', {
          service: 'com.example.app',
        })
      ).resolves.toEqual({
        service: 'com.example.app',
        storage: 'KeystoreAESGCM_NoAuth',
      });

      expect(
        nativeKeychainManagerMock.setGenericPasswordForOptions
      ).toHaveBeenCalledTimes(1);
      expect(
        nativeKeychainManagerMock.setGenericPasswordForOptions
      ).toHaveBeenCalledWith(
        {
          service: 'com.example.app',
          authenticationPrompt: AUTH_PROMPT_DEFAULTS,
        },
        'user',
        'pass'
      );
    });

    it('supplies the default prompt when called without options', async () => {
      nativeKeychainManagerMock.setGenericPasswordForOptions.mockResolvedValue(
        false
      );

      await expect(
        Keychain.setGenericPassword('user', 'pass')
      ).resolves.toBe(false);

      expect(
        nativeKeychainManagerMock.setGenericPasswordForOptions
      ).toHaveBeenCalledWith(
        { authenticationPrompt: AUTH_PROMPT_DEFAULTS },
        'user',
        'pass'
      );
    });

    it('merges a custom authentication prompt over the defaults', async () => {
      nativeKeychainManagerMock.setGenericPasswordForOptions.mockResolvedValue(
        null
      );

      await Keychain.setGenericPassword('user', 'pass', {
        authenticationPrompt: { title: 'Unlock', deviceOwner: 'biometric' },
      });

      expect(
        nativeKeychainManagerMock.setGenericPasswordForOptions.mock.calls[0][0]
      ).toEqual({
        authenticationPrompt: {
          title: 'Unlock',
          cancel: 'Cancel',
          deviceOwner: 'biometric',
        },
      });
    });
  });

  describe('getGenericPassword', () => {
    it('normalizes the auth prompt and returns the stored credentials', async () => {
      nativeKeychainManagerMock.getGenericPasswordForOptions.mockResolvedValue(
        {
          service: 'com.example.app',
          storage: 'KeystoreAESGCM',
          username: 'user',
          password: 'pass',
        }
      );

      await expect(
        Keychain.getGenericPassword({ service: 'com.example.app' })
      ).resolves.toEqual({
        service: 'com.example.app',
        storage: 'KeystoreAESGCM',
        username: 'user',
        password: 'pass',
      });

      expect(
        nativeKeychainManagerMock.getGenericPasswordForOptions
      ).toHaveBeenCalledWith({
        service: 'com.example.app',
        authenticationPrompt: AUTH_PROMPT_DEFAULTS,
      });
    });

    it('resolves to false when nothing is stored', async () => {
      nativeKeychainManagerMock.getGenericPasswordForOptions.mockResolvedValue(
        false
      );

      await expect(Keychain.getGenericPassword()).resolves.toBe(false);
    });
  });

  describe('hasGenericPassword', () => {
    it('passes the options through without normalization', async () => {
      nativeKeychainManagerMock.hasGenericPasswordForOptions.mockResolvedValue(
        true
      );
      const options = { service: 'com.example.app' };

      await expect(Keychain.hasGenericPassword(options)).resolves.toBe(true);
      expect(
        nativeKeychainManagerMock.hasGenericPasswordForOptions
      ).toHaveBeenCalledTimes(1);
      expect(
        nativeKeychainManagerMock.hasGenericPasswordForOptions.mock.calls[0][0]
      ).toBe(options);
    });
  });

  describe('resetGenericPassword', () => {
    it('passes the options through without normalization', async () => {
      nativeKeychainManagerMock.resetGenericPasswordForOptions.mockResolvedValue(
        true
      );
      const options = { service: 'com.example.app' };

      await expect(Keychain.resetGenericPassword(options)).resolves.toBe(true);
      expect(
        nativeKeychainManagerMock.resetGenericPasswordForOptions.mock.calls[0][0]
      ).toBe(options);
    });
  });

  describe('getAllGenericPasswordServices', () => {
    it('passes the options through and resolves to the service list', async () => {
      nativeKeychainManagerMock.getAllGenericPasswordServices.mockResolvedValue(
        ['com.example.app', 'com.other.app']
      );
      const options = { skipUIAuth: true };

      await expect(
        Keychain.getAllGenericPasswordServices(options)
      ).resolves.toEqual(['com.example.app', 'com.other.app']);
      expect(
        nativeKeychainManagerMock.getAllGenericPasswordServices.mock.calls[0][0]
      ).toBe(options);
    });
  });

  describe('hasInternetCredentials', () => {
    it('passes the options through without normalization', async () => {
      nativeKeychainManagerMock.hasInternetCredentialsForOptions.mockResolvedValue(
        false
      );
      const options = { server: 'https://example.com' };

      await expect(Keychain.hasInternetCredentials(options)).resolves.toBe(
        false
      );
      expect(
        nativeKeychainManagerMock.hasInternetCredentialsForOptions.mock.calls[0][0]
      ).toBe(options);
    });
  });

  describe('setInternetCredentials', () => {
    it('forwards server, username, password and normalized options', async () => {
      nativeKeychainManagerMock.setInternetCredentialsForServer.mockResolvedValue(
        { service: 'https://example.com', storage: 'KeystoreAESGCM' }
      );

      await expect(
        Keychain.setInternetCredentials(
          'https://example.com',
          'user',
          'pass',
          { accessGroup: 'group.example' }
        )
      ).resolves.toEqual({
        service: 'https://example.com',
        storage: 'KeystoreAESGCM',
      });

      expect(
        nativeKeychainManagerMock.setInternetCredentialsForServer
      ).toHaveBeenCalledWith(
        'https://example.com',
        'user',
        'pass',
        {
          accessGroup: 'group.example',
          authenticationPrompt: AUTH_PROMPT_DEFAULTS,
        }
      );
    });
  });

  describe('getInternetCredentials', () => {
    it('forwards the server and normalized options', async () => {
      nativeKeychainManagerMock.getInternetCredentialsForServer.mockResolvedValue(
        {
          server: 'https://example.com',
          username: 'user',
          password: 'pass',
          storage: 'KeystoreAESGCM',
        }
      );

      await expect(
        Keychain.getInternetCredentials('https://example.com')
      ).resolves.toEqual({
        server: 'https://example.com',
        username: 'user',
        password: 'pass',
        storage: 'KeystoreAESGCM',
      });

      expect(
        nativeKeychainManagerMock.getInternetCredentialsForServer
      ).toHaveBeenCalledWith('https://example.com', {
        authenticationPrompt: AUTH_PROMPT_DEFAULTS,
      });
    });
  });

  describe('resetInternetCredentials', () => {
    it('passes the options through without normalization', async () => {
      nativeKeychainManagerMock.resetInternetCredentialsForOptions.mockResolvedValue(
        undefined
      );
      const options = { server: 'https://example.com' };

      await expect(
        Keychain.resetInternetCredentials(options)
      ).resolves.toBeUndefined();
      expect(
        nativeKeychainManagerMock.resetInternetCredentialsForOptions.mock.calls[0][0]
      ).toBe(options);
    });
  });

  describe('getSupportedBiometryType', () => {
    it('delegates to the native module when available', async () => {
      nativeKeychainManagerMock.getSupportedBiometryType.mockResolvedValue(
        'Fingerprint'
      );

      await expect(Keychain.getSupportedBiometryType()).resolves.toBe(
        'Fingerprint'
      );
    });

    it('resolves to null when the native method is unavailable', async () => {
      removeNativeMethod('getSupportedBiometryType');

      await expect(Keychain.getSupportedBiometryType()).resolves.toBeNull();
    });
  });

  describe('requestSharedWebCredentials', () => {
    it('rejects on non-iOS platforms without touching the native module', async () => {
      (Platform as { OS: string }).OS = 'android';

      await expect(
        Keychain.requestSharedWebCredentials()
      ).rejects.toThrow(
        'requestSharedWebCredentials() is not supported on android yet'
      );
      expect(
        nativeKeychainManagerMock.requestSharedWebCredentials
      ).not.toHaveBeenCalled();
    });

    it('delegates to the native module on iOS', async () => {
      (Platform as { OS: string }).OS = 'ios';
      nativeKeychainManagerMock.requestSharedWebCredentials.mockResolvedValue({
        server: 'https://example.com',
        username: 'user',
        password: 'pass',
      });

      await expect(Keychain.requestSharedWebCredentials()).resolves.toEqual({
        server: 'https://example.com',
        username: 'user',
        password: 'pass',
      });
    });
  });

  describe('setSharedWebCredentials', () => {
    it('rejects on non-iOS platforms without touching the native module', async () => {
      (Platform as { OS: string }).OS = 'harmony';

      await expect(
        Keychain.setSharedWebCredentials('https://example.com', 'user', 'pass')
      ).rejects.toThrow(
        'setSharedWebCredentials() is not supported on harmony yet'
      );
      expect(
        nativeKeychainManagerMock.setSharedWebCredentialsForServer
      ).not.toHaveBeenCalled();
    });

    it('delegates to the native module on iOS', async () => {
      (Platform as { OS: string }).OS = 'ios';
      nativeKeychainManagerMock.setSharedWebCredentialsForServer.mockResolvedValue(
        undefined
      );

      await expect(
        Keychain.setSharedWebCredentials('https://example.com', 'user', 'pass')
      ).resolves.toBeUndefined();

      expect(
        nativeKeychainManagerMock.setSharedWebCredentialsForServer
      ).toHaveBeenCalledWith('https://example.com', 'user', 'pass');
    });
  });

  describe('canImplyAuthentication', () => {
    it('resolves to false when the native method is unavailable', async () => {
      removeNativeMethod('canCheckAuthentication');

      await expect(Keychain.canImplyAuthentication()).resolves.toBe(false);
    });

    it('delegates to the native module with the given options', async () => {
      nativeKeychainManagerMock.canCheckAuthentication.mockResolvedValue(true);
      const options = { authenticationType: 'AuthenticationWithBiometrics' };

      await expect(Keychain.canImplyAuthentication(options)).resolves.toBe(
        true
      );
      expect(
        nativeKeychainManagerMock.canCheckAuthentication.mock.calls[0][0]
      ).toBe(options);
    });
  });

  describe('getSecurityLevel', () => {
    it('resolves to null when the native method is unavailable', async () => {
      removeNativeMethod('getSecurityLevel');

      await expect(Keychain.getSecurityLevel()).resolves.toBeNull();
    });

    it('delegates to the native module with the given options', async () => {
      nativeKeychainManagerMock.getSecurityLevel.mockResolvedValue(
        'SECURE_HARDWARE'
      );
      const options = { accessControl: 'BiometryCurrentSet' };

      await expect(Keychain.getSecurityLevel(options)).resolves.toBe(
        'SECURE_HARDWARE'
      );
      expect(
        nativeKeychainManagerMock.getSecurityLevel.mock.calls[0][0]
      ).toBe(options);
    });
  });

  describe('isPasscodeAuthAvailable', () => {
    it('resolves to false when the native method is unavailable', async () => {
      removeNativeMethod('isPasscodeAuthAvailable');

      await expect(Keychain.isPasscodeAuthAvailable()).resolves.toBe(false);
    });

    it('delegates to the native module', async () => {
      nativeKeychainManagerMock.isPasscodeAuthAvailable.mockResolvedValue(true);

      await expect(Keychain.isPasscodeAuthAvailable()).resolves.toBe(true);
    });
  });

  describe('default export', () => {
    it('exposes the API functions included in the default export', () => {
      const functions = [
        'setGenericPassword',
        'getGenericPassword',
        'resetGenericPassword',
        'getAllGenericPasswordServices',
        'setInternetCredentials',
        'getInternetCredentials',
        'resetInternetCredentials',
        'getSupportedBiometryType',
        'requestSharedWebCredentials',
        'setSharedWebCredentials',
        'canImplyAuthentication',
        'getSecurityLevel',
        'isPasscodeAuthAvailable',
      ];

      for (const name of functions) {
        expect((KeychainDefault as Record<string, unknown>)[name]).toBe(
          (Keychain as Record<string, unknown>)[name]
        );
      }
    });

    it('re-exports every enum', () => {
      const enums = [
        'ACCESSIBLE',
        'ACCESS_CONTROL',
        'AUTHENTICATION_TYPE',
        'SECURITY_LEVEL',
        'STORAGE_TYPE',
        'BIOMETRY_TYPE',
        'ERROR_CODE',
      ];

      for (const name of enums) {
        expect((KeychainDefault as Record<string, unknown>)[name]).toBe(
          (Keychain as Record<string, unknown>)[name]
        );
      }
    });
  });
});

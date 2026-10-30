/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ACCESSIBLE,
  ACCESS_CONTROL,
  AUTHENTICATION_TYPE,
  SECURITY_LEVEL,
  BIOMETRY_TYPE,
  STORAGE_TYPE,
  ERROR_CODE,
} from '../../src/enums';

describe('enums', () => {
  describe('ACCESSIBLE', () => {
    it('maps every member to its keychain attribute string', () => {
      expect(ACCESSIBLE.WHEN_UNLOCKED).toBe('AccessibleWhenUnlocked');
      expect(ACCESSIBLE.AFTER_FIRST_UNLOCK).toBe('AccessibleAfterFirstUnlock');
      expect(ACCESSIBLE.ALWAYS).toBe('AccessibleAlways');
      expect(ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY).toBe(
        'AccessibleWhenPasscodeSetThisDeviceOnly'
      );
      expect(ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY).toBe(
        'AccessibleWhenUnlockedThisDeviceOnly'
      );
      expect(ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY).toBe(
        'AccessibleAfterFirstUnlockThisDeviceOnly'
      );
    });

    it('has six members', () => {
      expect(Object.keys(ACCESSIBLE)).toHaveLength(6);
    });
  });

  describe('ACCESS_CONTROL', () => {
    it('maps every member to its access control string', () => {
      expect(ACCESS_CONTROL.USER_PRESENCE).toBe('UserPresence');
      expect(ACCESS_CONTROL.BIOMETRY_ANY).toBe('BiometryAny');
      expect(ACCESS_CONTROL.BIOMETRY_CURRENT_SET).toBe('BiometryCurrentSet');
      expect(ACCESS_CONTROL.DEVICE_PASSCODE).toBe('DevicePasscode');
      expect(ACCESS_CONTROL.APPLICATION_PASSWORD).toBe('ApplicationPassword');
      expect(ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE).toBe(
        'BiometryAnyOrDevicePasscode'
      );
      expect(ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE).toBe(
        'BiometryCurrentSetOrDevicePasscode'
      );
    });

    it('has seven members', () => {
      expect(Object.keys(ACCESS_CONTROL)).toHaveLength(7);
    });
  });

  describe('AUTHENTICATION_TYPE', () => {
    it('maps every member to its authentication type string', () => {
      expect(AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS).toBe(
        'AuthenticationWithBiometricsDevicePasscode'
      );
      expect(AUTHENTICATION_TYPE.BIOMETRICS).toBe(
        'AuthenticationWithBiometrics'
      );
    });

    it('has two members', () => {
      expect(Object.keys(AUTHENTICATION_TYPE)).toHaveLength(2);
    });
  });

  describe('SECURITY_LEVEL', () => {
    it('maps every member to its security level string', () => {
      expect(SECURITY_LEVEL.SECURE_SOFTWARE).toBe('SECURE_SOFTWARE');
      expect(SECURITY_LEVEL.SECURE_HARDWARE).toBe('SECURE_HARDWARE');
      expect(SECURITY_LEVEL.ANY).toBe('ANY');
    });

    it('has three members', () => {
      expect(Object.keys(SECURITY_LEVEL)).toHaveLength(3);
    });
  });

  describe('BIOMETRY_TYPE', () => {
    it('maps every member to its biometry type string', () => {
      expect(BIOMETRY_TYPE.TOUCH_ID).toBe('TouchID');
      expect(BIOMETRY_TYPE.FACE_ID).toBe('FaceID');
      expect(BIOMETRY_TYPE.OPTIC_ID).toBe('OpticID');
      expect(BIOMETRY_TYPE.FINGERPRINT).toBe('Fingerprint');
      expect(BIOMETRY_TYPE.FACE).toBe('Face');
      expect(BIOMETRY_TYPE.IRIS).toBe('Iris');
    });

    it('has six distinct values', () => {
      const values = Object.values(BIOMETRY_TYPE);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe('STORAGE_TYPE', () => {
    it('maps every member to its keystore storage string', () => {
      expect(STORAGE_TYPE.AES_CBC).toBe('KeystoreAESCBC');
      expect(STORAGE_TYPE.AES_GCM_NO_AUTH).toBe('KeystoreAESGCM_NoAuth');
      expect(STORAGE_TYPE.AES_GCM).toBe('KeystoreAESGCM');
      expect(STORAGE_TYPE.RSA).toBe('KeystoreRSAECB');
    });

    it('has four distinct values', () => {
      const values = Object.values(STORAGE_TYPE);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe('ERROR_CODE', () => {
    it('maps every member to its E-prefixed error code string', () => {
      expect(ERROR_CODE.PASSCODE_NOT_SET).toBe('E_PASSCODE_NOT_SET');
      expect(ERROR_CODE.BIOMETRIC_NOT_ENROLLED).toBe('E_BIOMETRIC_NOT_ENROLLED');
      expect(ERROR_CODE.BIOMETRIC_TIMEOUT).toBe('E_BIOMETRIC_TIMEOUT');
      expect(ERROR_CODE.BIOMETRIC_LOCKOUT).toBe('E_BIOMETRIC_LOCKOUT');
      expect(ERROR_CODE.BIOMETRIC_LOCKOUT_PERMANENT).toBe(
        'E_BIOMETRIC_LOCKOUT_PERMANENT'
      );
      expect(ERROR_CODE.BIOMETRIC_TEMPORARILY_UNAVAILABLE).toBe(
        'E_BIOMETRIC_TEMPORARILY_UNAVAILABLE'
      );
      expect(ERROR_CODE.BIOMETRIC_UNAVAILABLE).toBe('E_BIOMETRIC_UNAVAILABLE');
      expect(ERROR_CODE.BIOMETRIC_VENDOR_ERROR).toBe('E_BIOMETRIC_VENDOR_ERROR');
      expect(ERROR_CODE.AUTH_INTERACTION_NOT_ALLOWED).toBe(
        'E_AUTH_INTERACTION_NOT_ALLOWED'
      );
      expect(ERROR_CODE.AUTH_INVALIDATED).toBe('E_AUTH_INVALIDATED');
      expect(ERROR_CODE.AUTH_CANCELED).toBe('E_AUTH_CANCELED');
      expect(ERROR_CODE.AUTH_ERROR).toBe('E_AUTH_ERROR');
      expect(ERROR_CODE.INVALID_PARAMETERS).toBe('E_INVALID_PARAMETERS');
      expect(ERROR_CODE.STORAGE_ACCESS_ERROR).toBe('E_STORAGE_ACCESS_ERROR');
      expect(ERROR_CODE.INTERNAL_ERROR).toBe('E_INTERNAL_ERROR');
    });

    it('has fifteen distinct values', () => {
      const values = Object.values(ERROR_CODE);
      expect(values).toHaveLength(15);
      expect(new Set(values).size).toBe(values.length);
    });
  });
});

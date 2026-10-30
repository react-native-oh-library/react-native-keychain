/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AUTH_PROMPT_DEFAULTS,
  normalizeAuthPrompt,
} from '../../src/normalizeOptions';

describe('normalizeOptions', () => {
  describe('AUTH_PROMPT_DEFAULTS', () => {
    it('contains the default prompt title and cancel label', () => {
      expect(AUTH_PROMPT_DEFAULTS).toEqual({
        title: 'Authenticate to retrieve secret',
        cancel: 'Cancel',
      });
    });
  });

  describe('normalizeAuthPrompt', () => {
    it('fills the default prompt when called without options', () => {
      expect(normalizeAuthPrompt()).toEqual({
        authenticationPrompt: {
          title: 'Authenticate to retrieve secret',
          cancel: 'Cancel',
        },
      });
    });

    it('fills the default prompt when options is explicitly undefined', () => {
      expect(normalizeAuthPrompt(undefined)).toEqual({
        authenticationPrompt: AUTH_PROMPT_DEFAULTS,
      });
    });

    it('keeps sibling option fields untouched', () => {
      expect(
        normalizeAuthPrompt({
          service: 'com.example.app',
          accessControl: 'UserPresence',
        })
      ).toEqual({
        service: 'com.example.app',
        accessControl: 'UserPresence',
        authenticationPrompt: AUTH_PROMPT_DEFAULTS,
      });
    });

    it('merges a partial authentication prompt over the defaults', () => {
      const result = normalizeAuthPrompt({
        authenticationPrompt: { subtitle: 'Unlock to continue' },
      });

      expect(result.authenticationPrompt).toEqual({
        title: 'Authenticate to retrieve secret',
        cancel: 'Cancel',
        subtitle: 'Unlock to continue',
      });
    });

    it('keeps a fully specified authentication prompt as-is', () => {
      const authenticationPrompt = {
        title: 'Custom title',
        subtitle: 'Custom subtitle',
        description: 'Custom description',
        cancel: 'Custom cancel',
      };

      expect(
        normalizeAuthPrompt({ authenticationPrompt }).authenticationPrompt
      ).toEqual(authenticationPrompt);
    });

    it('overrides default keys when the prompt supplies them', () => {
      const result = normalizeAuthPrompt({
        authenticationPrompt: { title: 'Only title changes' },
      });

      expect(result.authenticationPrompt).toEqual({
        title: 'Only title changes',
        cancel: 'Cancel',
      });
    });

    it('does not mutate the options passed in', () => {
      const options = {
        service: 'com.example.app',
        authenticationPrompt: { title: 'Kept' } as Record<string, string>,
      };

      normalizeAuthPrompt(options);

      expect(options).toEqual({
        service: 'com.example.app',
        authenticationPrompt: { title: 'Kept' },
      });
    });

    it('drops an undefined authenticationPrompt and uses the defaults', () => {
      const result = normalizeAuthPrompt({ authenticationPrompt: undefined });

      expect(result.authenticationPrompt).toEqual(AUTH_PROMPT_DEFAULTS);
    });
  });
});

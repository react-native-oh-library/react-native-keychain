/*
 * Copyright (c) 2025 Huawei Device Co., Ltd. All rights reserved
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


import type {RNPackageContext, RNPackage} from '@rnoh/react-native-openharmony/ts';
import KeychainPackage from '@react-native-ohos/react-native-keychain';
export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new KeychainPackage(ctx),
  ];
}

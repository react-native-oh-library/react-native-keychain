import type {
  UITurboModule,
  UITurboModuleContext
} from '@rnoh/react-native-openharmony/ts';
import { RNOHPackage, TurboModulesFactory } from '@rnoh/react-native-openharmony';
import type { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { RNKeychainManager } from './generated/turboModules/RNKeychainManager';
import { KeychainTurboModule } from './KeychainTurboModule';
import Logger from './Logger';

const TAG = 'KeychainPackage';

class RNKeychainTurboModuleFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (this.hasTurboModule(name)) {
      return new KeychainTurboModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === RNKeychainManager.NAME;
  }
}

export class KeychainPackage extends RNOHPackage {
  getUITurboModuleFactoryByNameMap(): Map<
    string,
    (ctx: UITurboModuleContext) => UITurboModule | null
  > {
    const map = new Map<string, (ctx: UITurboModuleContext) => UITurboModule | null>();
    map.set(RNKeychainManager.NAME, (ctx: UITurboModuleContext) => {
      try {
        return new KeychainTurboModule(ctx);
      } catch (error) {
        Logger.error(TAG, `failed to create KeychainTurboModule: ${JSON.stringify(error)}`);
        return null;
      }
    });
    return map;
  }

  createTurboModulesFactory(ctx: UITurboModuleContext): TurboModulesFactory {
    return new RNKeychainTurboModuleFactory(ctx);
  }

  getDebugName(): string {
    return 'KeychainPackage';
  }
}

export default KeychainPackage;

import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

export type SelectOptions = {
  path ?: string;
  filter ?: string;
}

export interface Spec extends TurboModule {
  Show(SelectOptions?:SelectOptions,  onDone ?: (res:string[])=>void, onCancel ?: ()=>void): void;
}

export default TurboModuleRegistry.get<Spec>('RNFileSelector') as Spec | null;
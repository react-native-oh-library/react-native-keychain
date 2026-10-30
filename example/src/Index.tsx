import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Keychain from '@react-native-ohos/react-native-keychain';

type LogEntry = {
  time: string;
  api: string;
  ok: boolean;
  detail: string;
  /** API 调用耗时(毫秒) */
  elapsed?: number;
};

//设备处于什么锁屏状态时允许读取这条凭据
const ACCESSIBLE_OPTIONS: Keychain.ACCESSIBLE[] = [
  //钥匙串中的数据无论设备是否锁定都可以访问
  Keychain.ACCESSIBLE.ALWAYS, 
  //在设备重新启动后，钥匙串项目里的数据不能访问，除非用户先解锁过一次设备
  Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
  //在设备重新启动后，钥匙串项目中的数据在用户第一次解锁设备之前无法访问。具有此属性的项目永远不会迁移到新设备上
  Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  
  //OK 钥匙串里的数据只有在设备解锁时才能访问。只有在设备设置了密码的情况下才可用。带有此属性的项目永远不会迁移到新设备上
  Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  //钥匙串里的数据只有在用户解锁设备时才能访问
  Keychain.ACCESSIBLE.WHEN_UNLOCKED,
  //钥匙串项目中的数据只有在用户解锁设备时才能访问。具有此属性的项目不会迁移到新设备上
  Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,

];

// null 表示不设置 accessControl(普通存储,读取不弹认证)
const ACCESS_CONTROL_OPTIONS: (Keychain.ACCESS_CONTROL | null)[] = [
  null,
  Keychain.ACCESS_CONTROL.USER_PRESENCE,//限制用 Touch ID 或密码访问某个项目
  Keychain.ACCESS_CONTROL.BIOMETRY_ANY,//限制用任何已注册手指的Touch ID访问项目
  Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,//限制只能用已注册手指的Touch ID访问项目
  Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,//使用设备密码访问某个项目的限制
  Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,//限制使用任何已注册手指或密码通过 Touch ID 访问某个项目
  Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,//限制使用当前已注册的指纹或密码来访问项目
];

function accessControlLabel(v: Keychain.ACCESS_CONTROL | null): string {
  return v === null ? '不设置' : v;
}

// null 表示不设置 securityLevel(鸿蒙原生侧当前忽略此选项,仅透传演示)
const SECURITY_LEVEL_OPTIONS: (Keychain.SECURITY_LEVEL | null)[] = [
  null,
  Keychain.SECURITY_LEVEL.SECURE_SOFTWARE
];

function securityLevelLabel(v: Keychain.SECURITY_LEVEL | null): string {
  return v === null ? '不设置' : v;
}

// null 表示不设置 authenticationType(默认语义:锁屏密码或生物识别任一可用即 true)
const AUTHENTICATION_TYPE_OPTIONS: (Keychain.AUTHENTICATION_TYPE | null)[] = [
  null,
  Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
  Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
];

function authTypeLabel(v: Keychain.AUTHENTICATION_TYPE | null): string {
  if (v === null) {
    return '不设置(默认)';
  }
  return v === Keychain.AUTHENTICATION_TYPE.BIOMETRICS
    ? 'BIOMETRICS(仅生物识别)'
    : 'DEVICE_PASSCODE_OR_BIOMETRICS(密码或生物识别)';
}

// Hermes 未内置 Intl,不能使用 toLocaleTimeString
function timeNow(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// 锁屏语义验证:点击后延时执行读取,期间用户锁屏,解锁后从日志的成败判断 accessible 语义
const DELAYED_READ_MS = 5000;

function LogList({ logs }: { logs: LogEntry[] }) {
  return (
    <View style={styles.logBox}>
      {logs.length === 0 ? (
        <Text style={styles.logEmpty}>暂无记录,点击上方按钮开始</Text>
      ) : (
        logs.map((log, i) => (
          <View key={i} style={styles.logEntry}>
            <Text style={styles.logHead}>
              {`[${log.time}] ${log.ok ? '✓' : '✗'} ${log.api}${
                log.elapsed !== undefined ? ` (${log.elapsed}ms)` : ''
              }`}
            </Text>
            <Text style={[styles.logDetail, { color: log.ok ? '#2e7d32' : '#c62828' }]}>
              {log.detail}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function Section({
  title,
  children,
  logs,
  onClear,
}: {
  title: string;
  children: React.ReactNode;
  logs: LogEntry[];
  onClear: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
      <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
        <Text style={styles.clearBtnText}>清空日志</Text>
      </TouchableOpacity>
      <LogList logs={logs} />
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

function ApiButton({
  title,
  desc,
  disabled,
  onPress,
  color,
}: {
  title: string;
  desc: string;
  disabled: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <View style={styles.btnRow}>
      <Button title={title} disabled={disabled} onPress={onPress} color={color} />
      <Text style={styles.btnDesc}>{desc}</Text>
    </View>
  );
}

export default function KeychainDemo() {
  // Generic Password 输入
  const [service, setService] = useState('com.demo.keychain');
  const [username, setUsername] = useState('user1');
  const [password, setPassword] = useState('pw-测试-123');
  const [accessible, setAccessible] = useState<Keychain.ACCESSIBLE>(
    Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK
  );
  const [accessControl, setAccessControl] = useState<Keychain.ACCESS_CONTROL | null>(null);
  const [securityLevel, setSecurityLevel] = useState<Keychain.SECURITY_LEVEL | null>(null);
  const [authType, setAuthType] = useState<Keychain.AUTHENTICATION_TYPE | null>(null);
  const [promptTitle, setPromptTitle] = useState('验证身份以读取密码');
  const [cloudSync, setCloudSync] = useState(false);
  // Internet Credentials 输入
  const [server, setServer] = useState('https://demo.example.com');
  const [webUsername, setWebUsername] = useState('web-user');
  const [webPassword, setWebPassword] = useState('web-pw');

  const [logsBySection, setLogsBySection] = useState<Record<string, LogEntry[]>>({});
  const [running, setRunning] = useState<string | null>(null);

  const appendLog = (section: string, entry: LogEntry) => {
    setLogsBySection(prev => ({
      ...prev,
      [section]: [entry, ...(prev[section] ?? [])].slice(0, 50),
    }));
  };

  const clearLogs = (section: string) => {
    setLogsBySection(prev => ({ ...prev, [section]: [] }));
  };

  const runApi = async (section: string, api: string, fn: () => Promise<unknown>) => {
    if (running !== null) {
      return;
    }
    setRunning(api);
    const start = Date.now();
    try {
      const r = await fn();
      const detail = r === undefined ? 'void' : JSON.stringify(r);
      appendLog(section, { time: timeNow(), api, ok: true, detail, elapsed: Date.now() - start });
    } catch (e: any) {
      appendLog(section, {
        time: timeNow(),
        api,
        ok: false,
        detail: e?.code ? `${e.code}: ${e?.message ?? e}` : String(e?.message ?? e),
        elapsed: Date.now() - start,
      });
    } finally {
      setRunning(null);
    }
  };

  const btnTitle = (name: string) => (running === name ? '执行中...' : name);

  const armDelayedRead = () => {
    if (running !== null) {
      return;
    }
    setRunning('getGenericPassword(延时)');
    appendLog('generic', {
      time: timeNow(),
      api: 'getGenericPassword(延时)',
      ok: true,
      detail: `已启动，${DELAYED_READ_MS / 1000} 秒后执行读取——请立即按电源键锁屏，解锁后回来看本日志`,
    });
    setTimeout(() => {
      const start = Date.now();
      Keychain.getGenericPassword({
        service: service || undefined,
        accessControl: accessControl ?? undefined,
        authenticationPrompt: { title: promptTitle || undefined },
      })
        .then(r => {
          appendLog('generic', {
            time: timeNow(),
            api: 'getGenericPassword(延时)',
            ok: true,
            detail: r ? JSON.stringify(r) : 'false(未存凭据)',
            elapsed: Date.now() - start,
          });
        })
        .catch((e: any) => {
          appendLog('generic', {
            time: timeNow(),
            api: 'getGenericPassword(延时)',
            ok: false,
            detail: e?.code ? `${e.code}: ${e?.message ?? e}` : String(e?.message ?? e),
            elapsed: Date.now() - start,
          });
        })
        .finally(() => setRunning(null));
    }, DELAYED_READ_MS);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 40 }}>
      <Section
        title="Generic Password"
        logs={logsBySection.generic ?? []}
        onClear={() => clearLogs('generic')}
      >
        <Field label="service" value={service} onChangeText={setService} placeholder="留空则用包名" />
        <Field label="username" value={username} onChangeText={setUsername} />
        <Field label="password" value={password} onChangeText={setPassword} secureTextEntry />
        <Text style={styles.label}>accessible(锁屏状态下能否读取)</Text>
        <View style={styles.chipWrap}>
          {ACCESSIBLE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => setAccessible(opt)}
              style={[styles.chip, accessible === opt && styles.chipActive]}
            >
              <Text style={[styles.chipText, accessible === opt && styles.chipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>accessControl(读取时是否要求用户认证;APPLICATION_PASSWORD 预期报错)</Text>
        <View style={styles.chipWrap}>
          {ACCESS_CONTROL_OPTIONS.map(opt => (
            <TouchableOpacity
              key={String(opt)}
              onPress={() => setAccessControl(opt)}
              style={[styles.chip, accessControl === opt && styles.chipActive]}
            >
              <Text style={[styles.chipText, accessControl === opt && styles.chipTextActive]}>
                {accessControlLabel(opt)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>securityLevel(安全等级;鸿蒙原生侧当前忽略此选项,仅演示透传)</Text>
        <View style={styles.chipWrap}>
          {SECURITY_LEVEL_OPTIONS.map(opt => (
            <TouchableOpacity
              key={String(opt)}
              onPress={() => setSecurityLevel(opt)}
              style={[styles.chip, securityLevel === opt && styles.chipActive]}
            >
              <Text style={[styles.chipText, securityLevel === opt && styles.chipTextActive]}>
                {securityLevelLabel(opt)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Field
          label="认证弹窗标题"
          value={promptTitle}
          onChangeText={setPromptTitle}
          placeholder="读取受保护凭据时系统弹窗标题"
        />
        <ApiButton
          title={btnTitle('setGenericPassword')}
          desc="保存/更新用户名和密码;service 已存在则覆盖,不存在则新建;设置 accessControl 后读取需通过认证;cloudSync 开启时标记同步到受信设备"
          disabled={running !== null}
          onPress={() =>
            runApi('generic', 'setGenericPassword', () =>
              Keychain.setGenericPassword(username, password, {
                service: service || undefined,
                accessible,
                accessControl: accessControl ?? undefined,
                securityLevel: securityLevel ?? undefined,
                cloudSync: cloudSync || undefined,
              })
            )
          }
        />
        <ApiButton
          title={btnTitle('getGenericPassword')}
          desc="读取当前 service 保存的用户名和密码,未存过返回 false;受保护凭据会弹出系统认证"
          disabled={running !== null}
          onPress={() =>
            runApi('generic', 'getGenericPassword', () =>
              Keychain.getGenericPassword({
                service: service || undefined,
                accessControl: accessControl ?? undefined,
                authenticationPrompt: { title: promptTitle || undefined },
              })
            )
          }
        />
        <ApiButton
          title={btnTitle('延时读取(锁屏验证)')}
          desc={`点击后 ${DELAYED_READ_MS / 1000} 秒才执行读取：点击后立即锁屏，用两个 service 分别设 WHEN_UNLOCKED 和 ALWAYS 跑一遍——前者锁屏时读取应失败、后者应成功，即验证 accessible 语义`}
          disabled={running !== null}
          onPress={armDelayedRead}
        />
        <ApiButton
          title={btnTitle('hasGenericPassword')}
          desc="检查当前 service 是否已保存过凭据,返回 true/false"
          disabled={running !== null}
          onPress={() =>
            runApi('generic', 'hasGenericPassword', () =>
              Keychain.hasGenericPassword({ service: service || undefined })
            )
          }
        />
        <ApiButton
          title={btnTitle('resetGenericPassword')}
          desc="删除当前 service 保存的凭据,删除不存在的 service 也算成功"
          disabled={running !== null}
          onPress={() =>
            runApi('generic', 'resetGenericPassword', () =>
              Keychain.resetGenericPassword({ service: service || undefined })
            )
          }
        />
        <ApiButton
          title={btnTitle('getAllGenericPasswordServices')}
          desc="列出本应用已保存的全部 service 列表"
          disabled={running !== null}
          onPress={() =>
            runApi('generic', 'getAllGenericPasswordServices', () =>
              Keychain.getAllGenericPasswordServices()
            )
          }
        />
      </Section>

      <Section
        title="Internet Credentials"
        logs={logsBySection.internet ?? []}
        onClear={() => clearLogs('internet')}
      >
        <Field label="server" value={server} onChangeText={setServer} />
        <Field label="username" value={webUsername} onChangeText={setWebUsername} />
        <Field label="password" value={webPassword} onChangeText={setWebPassword} secureTextEntry />
        <ApiButton
          title={btnTitle('setInternetCredentials')}
          desc="保存/更新网站账号密码,以 server 地址为标识"
          disabled={running !== null}
          onPress={() =>
            runApi('internet', 'setInternetCredentials', () =>
              Keychain.setInternetCredentials(server, webUsername, webPassword)
            )
          }
        />
        <ApiButton
          title={btnTitle('getInternetCredentials')}
          desc="读取该 server 对应的账号密码,未存过则返回空"
          disabled={running !== null}
          onPress={() =>
            runApi('internet', 'getInternetCredentials', () =>
              Keychain.getInternetCredentials(server)
            )
          }
        />
        <ApiButton
          title={btnTitle('hasInternetCredentials')}
          desc="检查该 server 是否已保存过凭据,返回 true/false"
          disabled={running !== null}
          onPress={() =>
            runApi('internet', 'hasInternetCredentials', () =>
              Keychain.hasInternetCredentials({ server })
            )
          }
        />
        <ApiButton
          title={btnTitle('resetInternetCredentials')}
          desc="删除该 server 保存的凭据"
          disabled={running !== null}
          onPress={() =>
            runApi('internet', 'resetInternetCredentials', () =>
              Keychain.resetInternetCredentials({ server })
            )
          }
        />
      </Section>

      <Section
        title="Device Capabilities"
        logs={logsBySection.device ?? []}
        onClear={() => clearLogs('device')}
      >
        <ApiButton
          title={btnTitle('getSupportedBiometryType')}
          desc="查询设备支持的生物识别类型(指纹/人脸),都不支持则返回空"
          disabled={running !== null}
          onPress={() =>
            runApi('device', 'getSupportedBiometryType', () => Keychain.getSupportedBiometryType())
          }
        />
        <Text style={styles.label}>authenticationType(限定探测的认证方式)</Text>
        <View style={styles.chipWrap}>
          {AUTHENTICATION_TYPE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={String(opt)}
              onPress={() => setAuthType(opt)}
              style={[styles.chip, authType === opt && styles.chipActive]}
            >
              <Text style={[styles.chipText, authType === opt && styles.chipTextActive]}>
                {authTypeLabel(opt)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <ApiButton
          title={btnTitle('canImplyAuthentication')}
          desc="查询设备是否具备认证能力;选 BIOMETRICS 时仅探测指纹/人脸(未录入生物识别则 false),默认含锁屏密码"
          disabled={running !== null}
          onPress={() =>
            runApi('device', 'canImplyAuthentication', () =>
              Keychain.canImplyAuthentication({
                authenticationType: authType ?? undefined,
              })
            )
          }
        />
        <ApiButton
          title={btnTitle('getSecurityLevel')}
          desc="查询凭据存储的安全等级(如硬件级加密)"
          disabled={running !== null}
          onPress={() => runApi('device', 'getSecurityLevel', () => Keychain.getSecurityLevel())}
        />
        <ApiButton
          title={btnTitle('isPasscodeAuthAvailable')}
          desc="查询设备是否设置了锁屏密码"
          disabled={running !== null}
          onPress={() =>
            runApi('device', 'isPasscodeAuthAvailable', () => Keychain.isPasscodeAuthAvailable())
          }
        />
      </Section>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    margin: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 10,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  fieldLabel: {
    width: 80,
    fontSize: 12,
    color: '#666',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipActive: {
    backgroundColor: '#1565c0',
    borderColor: '#1565c0',
  },
  chipText: {
    fontSize: 11,
    color: '#555',
  },
  chipTextActive: {
    color: '#fff',
  },
  btnRow: {
    marginTop: 8,
  },
  btnDesc: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  clearBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 6,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#1565c0',
  },
  logBox: {
    backgroundColor: '#fafafa',
    borderRadius: 6,
    padding: 8,
  },
  logEmpty: {
    fontSize: 12,
    color: '#aaa',
  },
  logEntry: {
    marginBottom: 8,
  },
  logHead: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  logDetail: {
    fontSize: 11,
    marginTop: 2,
  },
});

export const displayName = 'react-native-keychain-demo';
export const framework = 'React';
export const category = 'basic';
export const title = 'react-native-keychain-demo';
export const description = 'react-native-keychain 可交互操作 demo';

export const examples = [
  {
    title: 'react-native-keychain-demo',
    description: '可手动操作全部接口的演示页面',
    render: function (): any {
      return <KeychainDemo />;
    },
  },
];

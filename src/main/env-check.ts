import { execFile } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import WebSocket from 'ws';
import { AppSettings, EnvCheckResult } from '../shared/types';

const KNOWN_QQ_VERSIONS = ['9.9.26-44343'];

function exists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function regQuery(key: string): Promise<string> {
  return new Promise((resolve) => {
    execFile('reg', ['query', key], { windowsHide: true, timeout: 3000 }, (err, stdout) => {
      resolve(err ? '' : stdout || '');
    });
  });
}

const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');

const QQ_PATHS = [
  path.join(programFiles, 'Tencent', 'QQNT', 'QQ.exe'),
  path.join(programFilesX86, 'Tencent', 'QQNT', 'QQ.exe'),
  path.join(localAppData, 'Programs', 'Tencent', 'QQNT', 'QQ.exe'),
  path.join(programFiles, 'Tencent', 'QQ', 'Bin', 'QQ.exe')
];

const LITELOADER_FALLBACK_DIRS = [
  path.join(appData, 'LiteLoaderQQNT'),
  path.join(localAppData, 'LiteLoaderQQNT'),
  path.join(programFiles, 'LiteLoaderQQNT'),
  'C:\\LiteLoaderQQNT'
];

function qqRootDir(): string | null {
  for (const p of QQ_PATHS) {
    if (exists(p)) return path.dirname(p);
  }
  return null;
}

function qqVersionDirs(): string[] {
  const root = qqRootDir();
  if (!root) return [];
  const versionsDir = path.join(root, 'versions');
  if (!exists(versionsDir)) return [];
  try {
    return fs.readdirSync(versionsDir)
      .map((d) => path.join(versionsDir, d))
      .filter((d) => fs.statSync(d).isDirectory());
  } catch {
    return [];
  }
}

function findLiteLoaderJs(): string | null {
  for (const dir of qqVersionDirs()) {
    const candidate = path.join(dir, 'resources', 'app', 'app_launcher', 'LiteLoader.js');
    if (exists(candidate)) return candidate;
  }
  return null;
}

function parseLiteLoaderRoot(jsFile: string): string | null {
  try {
    const text = fs.readFileSync(jsFile, 'utf8');
    const m = text.match(/[A-Za-z]:\\[^`"'\r\n]*LiteLoaderQQNT[\\/]?/);
    if (m) {
      const raw = m[0].replace(/[\\/]+$/, '');
      return path.resolve(raw);
    }
    return null;
  } catch {
    return null;
  }
}

function findLiteLoaderRoot(): string | null {
  const js = findLiteLoaderJs();
  if (js) {
    const parsed = parseLiteLoaderRoot(js);
    if (parsed) return parsed;
  }
  for (const d of LITELOADER_FALLBACK_DIRS) {
    if (exists(d)) return d;
  }
  return null;
}

function findLLOneBot(): boolean {
  const root = findLiteLoaderRoot();
  if (root) {
    const pluginDir = path.join(root, 'plugins', 'LLOneBot');
    if (exists(path.join(pluginDir, 'manifest.json')) || exists(path.join(pluginDir, 'main'))) return true;
  }
  return false;
}

function checkWs(url: string, token: string, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    let target = url;
    if (token) {
      target += (url.includes('?') ? '&' : '?') + 'access_token=' + encodeURIComponent(token);
    }
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(target, {
        handshakeTimeout: timeoutMs,
        headers: token ? { Authorization: 'Bearer ' + token } : undefined
      });
    } catch {
      done(false);
      return;
    }
    const timer = setTimeout(() => {
      try { ws && ws.terminate(); } catch { /* ignore */ }
      done(false);
    }, timeoutMs + 400);
    ws.on('open', () => {
      clearTimeout(timer);
      try { ws && ws.close(); } catch { /* ignore */ }
      done(true);
    });
    ws.on('error', () => {
      clearTimeout(timer);
      done(false);
    });
  });
}

function normalizeQQVersion(v: string): string {
  const m = v.match(/(\d+\.\d+\.\d+)[.\-](\d+)/);
  if (m) return m[1] + '-' + m[2];
  return v;
}

function readQQVersion(): string | null {
  const root = qqRootDir();
  if (!root) return null;

  const cfgPath = path.join(root, 'versions', 'config.json');
  if (exists(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (cfg && cfg.curVersion && typeof cfg.curVersion === 'string' && cfg.curVersion.trim()) {
        return normalizeQQVersion(cfg.curVersion.trim());
      }
    } catch { /* ignore */ }
  }

  const versionsDir = path.join(root, 'versions');
  if (exists(versionsDir)) {
    try {
      const dirs = fs.readdirSync(versionsDir).filter((d) => /^\d+\.\d+\.\d+-\d+$/.test(d));
      if (dirs.length) return normalizeQQVersion(dirs[0]);
    } catch { /* ignore */ }
  }

  return null;
}

export async function runEnvChecks(settings: AppSettings): Promise<EnvCheckResult[]> {
  const osVersion = os.release();
  const results: EnvCheckResult[] = [];

  results.push({
    id: 'windows',
    ok: true,
    level: 'ok',
    title: 'Windows 系统',
    detail: '当前系统版本：Windows ' + osVersion + '，满足运行要求。',
    guidance: '无需额外操作。'
  });

  const qqFound = QQ_PATHS.some(exists);
  let qqDetail = qqFound ? '已检测到 NTQQ 安装。' : '未在常见安装路径中检测到 QQ NT。';
  const qqReg = await regQuery('HKCU\\Software\\Tencent\\QQ');
  if (!qqFound && qqReg) qqDetail = '已在注册表中检测到 QQ 相关记录。';
  results.push({
    id: 'ntqq',
    ok: qqFound || !!qqReg,
    level: qqFound || qqReg ? 'ok' : 'error',
    required: true,
    title: 'NTQQ（QQ 客户端）',
    detail: qqDetail,
    guidance: '请安装 Windows 版 QQ NT。',
    link: 'https://im.qq.com/pcqq'
  });

  const llonebotFound = findLLOneBot();
  const liteLoaderJs = findLiteLoaderJs();
  results.push({
    id: 'bot',
    ok: llonebotFound,
    level: llonebotFound ? 'ok' : 'error',
    required: true,
    title: 'LLOneBot + LiteLoaderQQNT',
    detail: llonebotFound
      ? '已检测到 LiteLoaderQQNT 启动器与 LLOneBot 插件。'
      : (liteLoaderJs ? '已检测到 LiteLoader.js 启动器，但未找到 LLOneBot 插件。' : '未检测到 LiteLoaderQQNT / LLOneBot 插件。'),
    guidance: '请安装 LiteLoaderQQNT 并将 LLOneBot 放入其 plugins 目录，随后在 QQ 中启用正向 WebSocket（默认 127.0.0.1:3001）。',
    link: llonebotFound ? undefined : 'https://github.com/LLOneBot/LLOneBot'
  });

  const qqVer = readQQVersion();
  if (!qqVer) {
    results.push({
      id: 'qq_version',
      ok: false,
      level: 'warn',
      title: 'QQ 版本匹配',
      detail: '已检测到 QQ，但无法读取具体版本号。',
      guidance: '建议使用本插件已验证适配的 QQ 版本：' + KNOWN_QQ_VERSIONS.join('、') + '。错误版本可能导致插件无法运行。',
      link: 'https://github.com/LLOneBot/LLOneBot'
    });
  } else if (KNOWN_QQ_VERSIONS.includes(qqVer)) {
    results.push({
      id: 'qq_version',
      ok: true,
      level: 'ok',
      title: 'QQ 版本匹配',
      detail: '当前 QQ 版本 ' + qqVer + ' 在本插件已验证适配范围内。',
      guidance: '无需额外操作。'
    });
  } else {
    results.push({
      id: 'qq_version',
      ok: false,
      level: 'warn',
      title: 'QQ 版本匹配',
      detail: '当前 QQ 版本 ' + qqVer + ' 不在已验证适配版本内。',
      guidance: '错误版本可能导致插件无法运行；建议更换为：' + KNOWN_QQ_VERSIONS.join('、') + '，并重新注入 LiteLoaderQQNT。',
      link: 'https://github.com/LLOneBot/LLOneBot'
    });
  }

  const wsUrl = settings.wsUrl || 'ws://127.0.0.1:3001';
  const wsOk = await checkWs(wsUrl, settings.token || '');
  results.push({
    id: 'onebot_ws',
    ok: wsOk,
    level: wsOk ? 'ok' : 'warn',
    title: 'OneBot 正向 WebSocket',
    detail: wsOk ? '成功连接 ' + wsUrl : '无法连接 ' + wsUrl + '（请确认 QQ 已登录且插件已启用）。',
    guidance: '启动官方 QQ 并登录需要接收消息的账号，打开 LLOneBot 设置，启用正向 WebSocket 并确保端口为 3001。'
  });

  return results;
}

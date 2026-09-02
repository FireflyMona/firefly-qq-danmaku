import { execFile } from 'child_process';
import * as net from 'net';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import WebSocket from 'ws';
import { AppSettings, EnvCheckResult } from '../shared/types';
import { translate } from '../shared/i18n';

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

function checkTcp(port: number, host = '127.0.0.1', timeoutMs = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => { if (!settled) { settled = true; resolve(ok); } };
    const sock = net.connect({ host, port });
    const timer = setTimeout(() => { try { sock.destroy(); } catch { /* ignore */ } done(false); }, timeoutMs);
    sock.on('connect', () => { clearTimeout(timer); try { sock.end(); } catch { /* ignore */ } done(true); });
    sock.on('error', () => { clearTimeout(timer); done(false); });
  });
}

function execFileText(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve) => {
    execFile(cmd, args, { windowsHide: true, timeout: 4000 }, (err, stdout) => {
      resolve(err ? '' : String(stdout || '').trim());
    });
  });
}

const WEIXIN_PATHS = [
  path.join(programFiles, 'Tencent', 'Weixin', 'Weixin.exe'),
  path.join(programFilesX86, 'Tencent', 'Weixin', 'Weixin.exe'),
  path.join(localAppData, 'Programs', 'Tencent', 'Weixin', 'Weixin.exe'),
  path.join(localAppData, 'Tencent', 'Weixin', 'Weixin.exe')
];

function findWeixinExe(): string | null {
  for (const p of WEIXIN_PATHS) if (exists(p)) return p;
  return null;
}

async function readWechatVersion(exe: string): Promise<string | null> {
  try {
    const out = await execFileText('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-Command', "(Get-Item -LiteralPath '" + exe + "').VersionInfo.FileVersion"
    ]);
    return out || null;
  } catch {
    return null;
  }
}

async function runPythonCheck(code: string): Promise<string> {
  try {
    return await execFileText('python', ['-c', code]);
  } catch {
    return '';
  }
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
    title: translate(settings.language, 'env.windows'),
    detail: translate(settings.language, 'env.windows.detail', { v: osVersion }),
    guidance: translate(settings.language, 'env.noAction')
  });

  const qqFound = QQ_PATHS.some(exists);
  let qqDetail = qqFound ? translate(settings.language, 'env.ntqq.detail.found') : translate(settings.language, 'env.ntqq.detail.notfound');
  const qqReg = await regQuery('HKCU\\Software\\Tencent\\QQ');
  if (!qqFound && qqReg) qqDetail = translate(settings.language, 'env.ntqq.detail.reg');
  results.push({
    id: 'ntqq',
    ok: qqFound || !!qqReg,
    level: qqFound || qqReg ? 'ok' : 'error',
    required: true,
    title: translate(settings.language, 'env.ntqq'),
    detail: qqDetail,
    guidance: translate(settings.language, 'env.ntqq.guidance'),
    link: 'https://im.qq.com/pcqq'
  });

  const llonebotFound = findLLOneBot();
  const liteLoaderJs = findLiteLoaderJs();
  results.push({
    id: 'bot',
    ok: llonebotFound,
    level: llonebotFound ? 'ok' : 'error',
    required: true,
    title: translate(settings.language, 'env.bot'),
    detail: llonebotFound
      ? translate(settings.language, 'env.bot.detail.found')
      : (liteLoaderJs ? translate(settings.language, 'env.bot.detail.launcher') : translate(settings.language, 'env.bot.detail.none')),
    guidance: translate(settings.language, 'env.bot.guidance'),
    link: llonebotFound ? undefined : 'https://github.com/LLOneBot/LLOneBot'
  });

  const qqVer = readQQVersion();
  if (!qqVer) {
    results.push({
      id: 'qq_version',
      ok: false,
      level: 'warn',
      title: translate(settings.language, 'env.qqVer'),
      detail: translate(settings.language, 'env.qqVer.detail.none'),
      guidance: translate(settings.language, 'env.qqVer.guidance', { versions: KNOWN_QQ_VERSIONS.join('、') }),
      link: 'https://github.com/LLOneBot/LLOneBot'
    });
  } else if (KNOWN_QQ_VERSIONS.includes(qqVer)) {
    results.push({
      id: 'qq_version',
      ok: true,
      level: 'ok',
      title: translate(settings.language, 'env.qqVer'),
      detail: translate(settings.language, 'env.qqVer.detail.ok', { v: qqVer }),
      guidance: translate(settings.language, 'env.noAction')
    });
  } else {
    results.push({
      id: 'qq_version',
      ok: false,
      level: 'warn',
      title: translate(settings.language, 'env.qqVer'),
      detail: translate(settings.language, 'env.qqVer.detail.mismatch', { v: qqVer }),
      guidance: translate(settings.language, 'env.qqVer.guidance.mismatch', { versions: KNOWN_QQ_VERSIONS.join('、') }),
      link: 'https://github.com/LLOneBot/LLOneBot'
    });
  }

  const wsUrl = settings.wsUrl || 'ws://127.0.0.1:3001';
  const wsOk = await checkWs(wsUrl, settings.token || '');
  results.push({
    id: 'onebot_ws',
    ok: wsOk,
    level: wsOk ? 'ok' : 'warn',
    title: translate(settings.language, 'env.ws'),
    detail: wsOk ? translate(settings.language, 'env.ws.detail.ok', { url: wsUrl }) : translate(settings.language, 'env.ws.detail.fail', { url: wsUrl }),
    guidance: translate(settings.language, 'env.ws.guidance')
  });


  // —— 微信（4.x + wechatauto-replica）前置检测 ——
  const weixinExe = findWeixinExe();
  const weixinVer = weixinExe ? await readWechatVersion(weixinExe) : null;
  const weixinOk = !!weixinExe && !!weixinVer && /^4\./.test(weixinVer);

  if (!weixinExe) {
    results.push({
      id: 'wechat_installed',
      ok: false,
      level: 'warn',
      title: translate(settings.language, 'env.wechat'),
      detail: translate(settings.language, 'env.wechat.detail.none'),
      guidance: translate(settings.language, 'env.wechat.guidance.none'),
      link: 'https://weixin.qq.com/'
    });
  } else if (!weixinOk) {
    results.push({
      id: 'wechat_installed',
      ok: false,
      level: 'warn',
      title: translate(settings.language, 'env.wechat'),
      detail: translate(settings.language, 'env.wechat.detail.old', { v: weixinVer || translate(settings.language, 'common.unknown') }),
      guidance: translate(settings.language, 'env.wechat.guidance.old'),
      link: 'https://weixin.qq.com/'
    });
  } else {
    results.push({
      id: 'wechat_installed',
      ok: true,
      level: 'ok',
      title: translate(settings.language, 'env.wechat'),
      detail: translate(settings.language, 'env.wechat.detail.ok', { v: weixinVer }),
      guidance: translate(settings.language, 'env.wechat.guidance.ok')
    });
  }

  const pythonOk = (await runPythonCheck('print("pyok")')).includes('pyok');
  const wechatautoOk = (await runPythonCheck('import wechatauto; print("waok")')).includes('waok');
  results.push({
    id: 'wechat_python',
    ok: pythonOk && wechatautoOk,
    level: (pythonOk && wechatautoOk) ? 'ok' : 'warn',
    title: translate(settings.language, 'env.python'),
    detail: (pythonOk && wechatautoOk)
      ? translate(settings.language, 'env.python.detail.ok')
      : (pythonOk ? translate(settings.language, 'env.python.detail.pythonOnly') : translate(settings.language, 'env.python.detail.none')),
    guidance: pythonOk
      ? translate(settings.language, 'env.python.guidance.pythonOnly')
      : translate(settings.language, 'env.python.guidance.none'),
    link: 'https://github.com/fanyuantaier/wechatauto-replica'
  });

  return results;
}

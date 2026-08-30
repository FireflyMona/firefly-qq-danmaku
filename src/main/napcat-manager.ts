import { execFile, spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function localAppData(): string {
  return process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
}

const NAPCAT_DIRS = [
  path.join(localAppData(), 'Programs', 'NapCat'),
  path.join(process.env.ProgramFiles || 'C:\\Program Files', 'NapCat'),
  path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'NapCat'),
  'C:\\NapCat'
];

function findNapCatDir(): string | null {
  for (const d of NAPCAT_DIRS) {
    if (fs.existsSync(path.join(d, 'NapCatWinBootMain.exe'))) return d;
  }
  return null;
}

function findQQExe(): string | null {
  const candidates = [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Tencent', 'QQNT', 'QQ.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Tencent', 'QQNT', 'QQ.exe'),
    path.join(localAppData(), 'Programs', 'Tencent', 'QQNT', 'QQ.exe')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function findNapCatAccount(dir: string): string | null {
  const cfgDir = path.join(dir, 'config');
  if (!fs.existsSync(cfgDir)) return null;
  try {
    const names = fs.readdirSync(cfgDir);
    for (const n of names) {
      const m = n.match(/^onebot11_(\d+)\.json$/);
      if (m) return m[1];
    }
    for (const n of names) {
      const m = n.match(/^napcat_(\d+)\.json$/);
      if (m) return m[1];
    }
  } catch { /* ignore */ }
  return null;
}

function taskkill(image: string): Promise<void> {
  return new Promise((resolve) => {
    execFile('taskkill', ['/f', '/im', image], { windowsHide: true, timeout: 5000 }, () => resolve());
  });
}

function isProcessRunning(image: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('tasklist', ['/fi', 'IMAGENAME eq ' + image, '/nh'], { windowsHide: true, timeout: 5000 }, (err, stdout) => {
      resolve(!err && (stdout || '').toLowerCase().includes(image.toLowerCase()));
    });
  });
}

export class NapCatManager {
  private child: ChildProcess | null = null;

  isInstalled(): boolean {
    return findNapCatDir() !== null;
  }

  async start(): Promise<boolean> {
    const dir = findNapCatDir();
    if (!dir) return false;
    const qq = findQQExe();
    if (!qq) return false;

    // NapCat 已在运行时不再重复启动，也不误关其 QQ 实例
    if (await isProcessRunning('NapCatWinBootMain.exe')) return true;

    // 下线官方版 QQ（此时 NapCat 未运行，QQ.exe 属于官方 QQ 或残留）
    await taskkill('QQ.exe');

    // 上线 NapCat：直接传账号快速登录；无账号则走二维码登录
    const launcher = path.join(dir, 'NapCatWinBootMain.exe');
    const hook = path.join(dir, 'NapCatWinBootHook.dll');
    const patchPackage = path.join(dir, 'qqnt.json');
    const loadPath = path.join(dir, 'loadNapCat.js');
    const mainPath = path.join(dir, 'napcat.mjs');
    const account = findNapCatAccount(dir);

    // launcher.bat 会生成指向当前目录 napcat.mjs 的 loadNapCat.js，
    // 并注入 NAPCAT_* 环境变量；这里直接复刻，否则 Hook DLL 找不到补丁文件会报“文件已损坏”。
    try {
      const mainUrlPath = mainPath.replace(/\\/g, '/');
      fs.writeFileSync(loadPath, `(async () => {await import("file:///${mainUrlPath}")})()`, 'utf8');
    } catch { /* 忽略写失败，沿用已有 loadNapCat.js */ }

    // 把启动器 stdout/stderr 重定向到日志文件，避免 QQ 因 --enable-logging 弹出一个黑色控制台窗口。
    let outFd: number | null = null;
    try {
      outFd = fs.openSync(path.join(os.tmpdir(), 'napcat-launcher.log'), 'a');
    } catch { /* ignore */ }

    const args = [qq, hook];
    if (account) args.push(account);

    const env = {
      ELECTRON_NO_ATTACH_CONSOLE: 'true',
      ...process.env,
      NAPCAT_PATCH_PACKAGE: patchPackage,
      NAPCAT_LOAD_PATH: loadPath,
      NAPCAT_INJECT_PATH: hook,
      NAPCAT_LAUNCHER_PATH: launcher,
      NAPCAT_MAIN_PATH: mainPath.replace(/\\/g, '/')
    };

    return new Promise((resolve) => {
      try {
        this.child = spawn(launcher, args, {
          cwd: dir,
          windowsHide: true,
          stdio: ['ignore', outFd ?? 'ignore', outFd ?? 'ignore'],
          env
        });
        if (outFd !== null) {
          try { fs.closeSync(outFd); } catch { /* ignore */ }
        }
        this.child.on('error', () => { this.child = null; resolve(false); });
        this.child.on('spawn', () => resolve(true));
        this.child.unref();
      } catch {
        if (outFd !== null) {
          try { fs.closeSync(outFd); } catch { /* ignore */ }
        }
        resolve(false);
      }
    });
  }

  async stop(): Promise<void> {
    if (this.child) {
      try { this.child.kill(); } catch { /* ignore */ }
      this.child = null;
    }
    await taskkill('NapCatWinBootMain.exe');
    await taskkill('QQ.exe');
  }
}

import { ChildProcess, spawn } from 'child_process';
import * as readline from 'readline';

const SCRIPT = String.raw`
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WechatForeground {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
}
"@

function Test-WechatForeground {
  $ids = @(Get-Process -Name Weixin -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
  if ($ids.Count -eq 0) { return $false }
  $h = [WechatForeground]::GetForegroundWindow()
  if ($h -eq [IntPtr]::Zero) { return $false }
  $pid2 = 0
  [WechatForeground]::GetWindowThreadProcessId($h, [ref]$pid2) | Out-Null
  return $ids -contains $pid2
}

$last = -1
while ($true) {
  $fg = Test-WechatForeground
  if ($fg -ne $last) {
    $last = $fg
    if ($fg) { Write-Output 'foreground' } else { Write-Output 'background' }
    [Console]::Out.Flush()
  }
  Start-Sleep -Milliseconds 250
}
`;

export class WechatWindowWatcher {
  private child: ChildProcess | null = null;

  start(onChange: (foreground: boolean) => void): void {
    if (this.child) return;
    let child: ChildProcess;
    try {
      child = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        SCRIPT
      ], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch {
      return;
    }
    this.child = child;

    const rl = readline.createInterface({ input: child.stdout! });
    rl.on('line', (line) => {
      const text = line.trim().toLowerCase();
      if (text === 'foreground') onChange(true);
      else if (text === 'background') onChange(false);
    });
    child.stderr && child.stderr.on('data', () => { /* ignore */ });
    child.on('exit', () => {
      if (this.child === child) this.child = null;
    });
  }

  stop(): void {
    if (!this.child) return;
    const child = this.child;
    this.child = null;
    try { child.kill(); } catch { /* ignore */ }
  }
}

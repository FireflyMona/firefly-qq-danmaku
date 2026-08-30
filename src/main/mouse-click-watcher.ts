import { ChildProcess, spawn } from 'child_process';
import * as readline from 'readline';

function buildScript(delayMs: number): string {
  return String.raw`
Add-Type -AssemblyName System.Windows.Forms
$leftPrev = $false
$rightPrev = $false
$armed = $false
$watch = [System.Diagnostics.Stopwatch]::StartNew()
while ($true) {
  Start-Sleep -Milliseconds 15
  $btns = [System.Windows.Forms.Control]::MouseButtons
  $l = ($btns -band [System.Windows.Forms.MouseButtons]::Left) -ne 0
  $r = ($btns -band [System.Windows.Forms.MouseButtons]::Right) -ne 0
  if (-not $armed) {
    if ($watch.ElapsedMilliseconds -ge ${delayMs}) {
      $armed = $true
      $leftPrev = $l
      $rightPrev = $r
    }
    continue
  }
  if ($l -and -not $leftPrev) {
    Write-Output 'down-left'
    [Console]::Out.Flush()
  }
  if ($r -and -not $rightPrev) {
    Write-Output 'down-right'
    [Console]::Out.Flush()
  }
  $leftPrev = $l
  $rightPrev = $r
}
`;
}

export type MouseButton = 'left' | 'right';

export class MouseClickWatcher {
  private child: ChildProcess | null = null;

  start(delayMs: number, onDown: (button: MouseButton) => void): void {
    this.stop();
    let child: ChildProcess;
    try {
      child = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        buildScript(delayMs)
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
      if (text === 'down-left') onDown('left');
      else if (text === 'down-right') onDown('right');
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

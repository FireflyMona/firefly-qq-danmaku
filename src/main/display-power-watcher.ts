import { ChildProcess, spawn } from 'child_process';
import * as readline from 'readline';

const SCRIPT = String.raw`
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class DisplayPowerWatcherForm : Form {
  [DllImport("user32.dll")]
  public static extern IntPtr RegisterPowerSettingNotification(IntPtr hRecipient, ref Guid PowerSettingGuid, int Flags);
  [DllImport("user32.dll")]
  public static extern bool UnregisterPowerSettingNotification(IntPtr handle);

  static Guid GUID_CONSOLE_DISPLAY_STATE = new Guid("6FE69556-704A-47A0-8F24-C28D936FDA47");
  const int WM_POWERBROADCAST = 0x0218;
  const int PBT_POWERSETTINGCHANGE = 0x8013;
  const int DEVICE_NOTIFY_WINDOW_HANDLE = 0;
  IntPtr notifyHandle = IntPtr.Zero;
  int lastState = -1;

  protected override void OnHandleCreated(EventArgs e) {
    base.OnHandleCreated(e);
    notifyHandle = RegisterPowerSettingNotification(this.Handle, ref GUID_CONSOLE_DISPLAY_STATE, DEVICE_NOTIFY_WINDOW_HANDLE);
  }

  protected override void WndProc(ref Message m) {
    try {
      if (m.Msg == WM_POWERBROADCAST && m.WParam.ToInt64() == PBT_POWERSETTINGCHANGE && m.LParam != IntPtr.Zero) {
        int state = Marshal.ReadInt32(m.LParam, 20);
        if (state != lastState) {
          lastState = state;
          Console.WriteLine(state == 0 ? "display-off" : "display-on");
          Console.Out.Flush();
        }
      }
    } catch { }
    base.WndProc(ref m);
  }

  protected override void OnHandleDestroyed(EventArgs e) {
    try { if (notifyHandle != IntPtr.Zero) UnregisterPowerSettingNotification(notifyHandle); } catch { }
    base.OnHandleDestroyed(e);
  }
}
"@ -ReferencedAssemblies System.Windows.Forms

$form = New-Object DisplayPowerWatcherForm
$form.ShowInTaskbar = $false
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$form.Size = New-Object System.Drawing.Size(1, 1)
$form.Opacity = 0
[System.Windows.Forms.Application]::Run($form)
`;

export class DisplayPowerWatcher {
  private child: ChildProcess | null = null;

  start(onChange: (displayOff: boolean) => void): void {
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
      if (text === 'display-off') onChange(true);
      else if (text === 'display-on') onChange(false);
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

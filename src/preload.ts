import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings, BannerItem, ConnectionState, EnvCheckResult } from './shared/types';

contextBridge.exposeInMainWorld('api', {
  envCheck: (): Promise<EnvCheckResult[]> => ipcRenderer.invoke('env:check'),
  install: (): Promise<{ ok: boolean; installDir?: string; error?: string }> => ipcRenderer.invoke('app:install'),
  onInstallProgress: (cb: (data: { percent: number; text: string }) => void) => ipcRenderer.on('install:progress', (_event, data) => cb(data)),
  setAutostart: (enabled: boolean): Promise<boolean> => ipcRenderer.invoke('installer:set-autostart', enabled),
  getAutostart: (): Promise<boolean> => ipcRenderer.invoke('installer:get-autostart'),
  finishInstall: (): Promise<void> => ipcRenderer.invoke('installer:finish'),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: AppSettings): Promise<AppSettings> => ipcRenderer.invoke('settings:set', settings),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:open', url),
  onBannerShow: (cb: (item: BannerItem) => void) => ipcRenderer.on('banner:show', (_event, item: BannerItem) => cb(item)),
  onBannerMeasure: (cb: (item: BannerItem) => void) => ipcRenderer.on('banner:measure', (_event, item: BannerItem) => cb(item)),
  onBannerRemove: (cb: (id: string) => void) => ipcRenderer.on('banner:remove', (_event, id: string) => cb(id)),
  reportHeight: (id: string, height: number) => ipcRenderer.send('banner:height', { id, height }),
  onBannerConfig: (cb: (config: { fontSize: number; opacity: number; width: number }) => void) => ipcRenderer.on('banner:config', (_event, config) => cb(config)),
  onConnectionState: (cb: (state: ConnectionState) => void) => ipcRenderer.on('connection:state', (_event, state: ConnectionState) => cb(state)),
  trayGetVisibility: (): Promise<boolean> => ipcRenderer.invoke('tray:get-visibility'),
  trayToggle: (): Promise<boolean> => ipcRenderer.invoke('tray:toggle'),
  trayQuit: (): Promise<void> => ipcRenderer.invoke('tray:quit'),
  trayUninstallOpen: (): Promise<void> => ipcRenderer.invoke('tray:uninstall-open'),
  trayUninstallCancel: (): Promise<void> => ipcRenderer.invoke('tray:uninstall-cancel'),
  trayUninstallConfirm: (): Promise<void> => ipcRenderer.invoke('tray:uninstall-confirm'),
  trayRefresh: (): Promise<boolean> => ipcRenderer.invoke('tray:refresh'),
  onTrayVisibility: (cb: (visible: boolean) => void) => ipcRenderer.on('tray:visibility', (_event, visible: boolean) => cb(visible))
});

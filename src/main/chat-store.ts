import * as fs from 'fs';
import * as path from 'path';
import { ChatMessage, ChatPeer, Conversation } from '../shared/types';

interface IndexEntry {
  lastReadTs: number;
  pinned: boolean;
  title?: string;
  avatar?: string;
}

function parsePeer(key: string): ChatPeer | null {
  const idx = key.indexOf(':');
  if (idx < 0) return null;
  const kind = key.slice(0, idx);
  const id = Number(key.slice(idx + 1));
  if ((kind !== 'private' && kind !== 'group') || !Number.isFinite(id)) return null;
  return { kind, id };
}

function fallbackTitle(peer: ChatPeer): string {
  return peer.kind === 'private' ? String(peer.id) : '群聊';
}

function fallbackAvatar(peer: ChatPeer): string {
  if (peer.kind === 'private') return 'https://q.qlogo.cn/headimg_dl?dst_uin=' + peer.id + '&spec=100';
  return 'https://p.qlogo.cn/gh/' + peer.id + '/' + peer.id + '/0';
}

export class ChatStore {
  private dir: string;
  private indexPath: string;
  private index: Record<string, IndexEntry> = {};
  private convMap = new Map<string, Conversation>();

  constructor(userDataDir: string) {
    this.dir = path.join(userDataDir, 'history');
    this.indexPath = path.join(this.dir, 'index.json');
    fs.mkdirSync(this.dir, { recursive: true });
    this.loadIndex();
    this.loadConversations();
  }

  private loadIndex(): void {
    try {
      const raw = fs.readFileSync(this.indexPath, 'utf8');
      this.index = JSON.parse(raw) || {};
    } catch {
      this.index = {};
    }
  }

  private persistIndex(): void {
    try {
      fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2), 'utf8');
    } catch { /* ignore */ }
  }

  private keyFor(peer: ChatPeer): string {
    return peer.kind + ':' + peer.id;
  }

  private fileFor(key: string): string {
    // Windows 文件名不允许冒号，改用下划线存储
    return path.join(this.dir, key.replace(/:/g, '_') + '.ndjson');
  }

  private loadConversations(): void {
    this.convMap.clear();
    let files: string[] = [];
    try { files = fs.readdirSync(this.dir).filter((f) => f.endsWith('.ndjson')); } catch { files = []; }
    for (const f of files) {
      const key = f.slice(0, -'.ndjson'.length);
      const peer = parsePeer(key);
      if (!peer) continue;
      const entry = this.index[key] || { lastReadTs: 0, pinned: false };
      let lines: string[] = [];
      try { lines = fs.readFileSync(this.fileFor(key), 'utf8').split('\n').filter((l) => l.trim()); } catch { lines = []; }
      let unread = 0;
      let last: ChatMessage | null = null;
      for (const line of lines) {
        let m: ChatMessage | null = null;
        try { m = JSON.parse(line); } catch { continue; }
        if (m) {
          last = m;
          if (m.direction === 'in' && m.ts > (entry.lastReadTs || 0)) unread += 1;
        }
      }
      this.convMap.set(key, {
        key,
        peer,
        title: entry.title || fallbackTitle(peer),
        avatar: entry.avatar || fallbackAvatar(peer),
        lastText: last ? last.plainText : '',
        lastTs: last ? last.ts : 0,
        unread,
        pinned: !!entry.pinned
      });
    }
  }

  getConversations(): Conversation[] {
    const list = Array.from(this.convMap.values());
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.lastTs || 0) - (a.lastTs || 0);
    });
  }

  getConversation(peer: ChatPeer): Conversation | undefined {
    return this.convMap.get(this.keyFor(peer));
  }

  append(msg: ChatMessage, title?: string, avatar?: string): void {
    const key = this.keyFor(msg.peer);
    const entry = this.index[key] || { lastReadTs: 0, pinned: false };
    if (title) entry.title = title;
    if (avatar) entry.avatar = avatar;
    this.index[key] = entry;

    try {
      fs.appendFileSync(this.fileFor(key), JSON.stringify(msg) + '\n', 'utf8');
    } catch { /* ignore */ }

    const conv = this.convMap.get(key);
    const titleStr = title || (conv ? conv.title : fallbackTitle(msg.peer));
    const avatarStr = avatar || (conv ? conv.avatar : fallbackAvatar(msg.peer));
    const unread = (conv ? conv.unread : 0) + (msg.direction === 'in' && msg.ts > (entry.lastReadTs || 0) ? 1 : 0);
    this.convMap.set(key, {
      key,
      peer: msg.peer,
      title: titleStr,
      avatar: avatarStr,
      lastText: msg.plainText || '',
      lastTs: msg.ts,
      unread,
      pinned: !!entry.pinned,
      memberCount: conv ? conv.memberCount : undefined
    });
    this.persistIndex();
  }

  setConversationMeta(peer: ChatPeer, meta: { title?: string; avatar?: string; memberCount?: number }): void {
    const key = this.keyFor(peer);
    const conv = this.convMap.get(key);
    if (conv) {
      if (meta.title) conv.title = meta.title;
      if (meta.avatar) conv.avatar = meta.avatar;
      if (meta.memberCount !== undefined) conv.memberCount = meta.memberCount;
      this.convMap.set(key, conv);
      const entry = this.index[key] || { lastReadTs: 0, pinned: false };
      if (meta.title) entry.title = meta.title;
      if (meta.avatar) entry.avatar = meta.avatar;
      this.index[key] = entry;
      this.persistIndex();
    }
  }

  getHistory(peer: ChatPeer, limit = 50, beforeTs?: number): ChatMessage[] {
    const key = this.keyFor(peer);
    let lines: string[] = [];
    try { lines = fs.readFileSync(this.fileFor(key), 'utf8').split('\n'); } catch { return []; }
    const out: ChatMessage[] = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const m = JSON.parse(line) as ChatMessage;
        if (beforeTs && m.ts >= beforeTs) continue;
        out.push(m);
      } catch { continue; }
    }
    return out.slice(-limit);
  }

  markRead(peer: ChatPeer): void {
    const key = this.keyFor(peer);
    const entry = this.index[key] || { lastReadTs: 0, pinned: false };
    entry.lastReadTs = Date.now();
    this.index[key] = entry;
    const conv = this.convMap.get(key);
    if (conv) { conv.unread = 0; this.convMap.set(key, conv); }
    this.persistIndex();
  }

  setPinned(peer: ChatPeer, pinned: boolean): void {
    const key = this.keyFor(peer);
    const entry = this.index[key] || { lastReadTs: 0, pinned: false };
    entry.pinned = pinned;
    this.index[key] = entry;
    const conv = this.convMap.get(key);
    if (conv) { conv.pinned = pinned; this.convMap.set(key, conv); }
    this.persistIndex();
  }

  deleteHistory(peer: ChatPeer): void {
    const key = this.keyFor(peer);
    try { fs.unlinkSync(this.fileFor(key)); } catch { /* ignore */ }
    delete this.index[key];
    this.convMap.delete(key);
    this.persistIndex();
  }

  markRecalled(peer: ChatPeer, localId: string): void {
    this.rewriteMessage(peer, localId, (m) => { m.recalled = true; });
  }

  setVoiceText(peer: ChatPeer, localId: string, text: string): void {
    this.rewriteMessage(peer, localId, (m) => { m.voiceText = text; });
  }

  setLocalFilePath(peer: ChatPeer, localId: string, p: string): void {
    this.rewriteMessage(peer, localId, (m) => { m.localFilePath = p; });
  }

  private rewriteMessage(peer: ChatPeer, localId: string, mutate: (m: ChatMessage) => void): void {
    const key = this.keyFor(peer);
    const file = this.fileFor(key);
    let lines: string[] = [];
    try { lines = fs.readFileSync(file, 'utf8').split('\n'); } catch { return; }
    const out: string[] = [];
    for (const line of lines) {
      if (!line.trim()) { out.push(line); continue; }
      try {
        const m = JSON.parse(line) as ChatMessage;
        if (m.id === localId) { mutate(m); out.push(JSON.stringify(m)); }
        else out.push(line);
      } catch { out.push(line); }
    }
    try { fs.writeFileSync(file, out.join('\n'), 'utf8'); } catch { /* ignore */ }
  }

  deleteMessages(peer: ChatPeer, localIds: string[]): void {
    const key = this.keyFor(peer);
    const file = this.fileFor(key);
    const idSet = new Set(localIds || []);
    let lines: string[] = [];
    try { lines = fs.readFileSync(file, 'utf8').split('\n'); } catch { return; }
    const out: string[] = [];
    let last: ChatMessage | null = null;
    let unread = 0;
    const entry = this.index[key] || { lastReadTs: 0, pinned: false };
    for (const line of lines) {
      if (!line.trim()) { out.push(line); continue; }
      let m: ChatMessage | null = null;
      try { m = JSON.parse(line); } catch { out.push(line); continue; }
      if (!m) { out.push(line); continue; }
      if (idSet.has(m.id)) continue;
      out.push(line);
      last = m;
      if (m.direction === 'in' && m.ts > (entry.lastReadTs || 0)) unread += 1;
    }
    try { fs.writeFileSync(file, out.join('\n'), 'utf8'); } catch { /* ignore */ }
    const conv = this.convMap.get(key);
    if (conv) {
      conv.lastText = last ? last.plainText : '';
      conv.lastTs = last ? last.ts : 0;
      conv.unread = unread;
      this.convMap.set(key, conv);
    }
    this.persistIndex();
  }

  unreadTotal(): number {
    let total = 0;
    for (const c of this.convMap.values()) total += c.unread;
    return total;
  }
}

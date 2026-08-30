import { randomUUID } from 'crypto';
import { AppSettings, BannerItem, OB11MessageEvent, OB11NoticeEvent, Segment } from '../shared/types';
import { OneBotClient } from './onebot';

function qqAvatar(qq: number): string {
  return 'https://q.qlogo.cn/headimg_dl?dst_uin=' + qq + '&spec=100';
}

function segmentText(seg: Segment): string {
  const data = seg.data || {};
  switch (seg.type) {
    case 'text':
      return data.text || '';
    case 'face':
      return '[表情]';
    case 'image':
      return '发来了一张图片';
    case 'record':
      return '发来了一条语音';
    case 'video':
      return '发来了一段视频';
    case 'file':
      return '发来了一个文件';
    case 'at':
      return '@' + (data.qq || '未知');
    case 'reply':
      return '';
    default:
      return '';
  }
}

function buildContent(segments: Segment[] | undefined, raw: string | undefined): string {
  if (Array.isArray(segments) && segments.length > 0) {
    const parts: string[] = [];
    for (const seg of segments) {
      const text = segmentText(seg);
      if (text) parts.push(text);
    }
    return parts.join(' ').trim() || (raw || '').trim();
  }
  return (raw || '').trim();
}

export async function normalizeMessageEvent(
  ev: OB11MessageEvent,
  settings: AppSettings,
  client: OneBotClient
): Promise<BannerItem | null> {
  if (!ev || ev.sender.user_id === ev.self_id) return null;
  if (ev.message_type === 'private' && !settings.showPrivate) return null;
  if (ev.message_type === 'group' && !settings.showGroup) return null;

  const isGroup = ev.message_type === 'group';
  const groupId = ev.group_id;
  if (isGroup && groupId && client.isGroupDnd(groupId)) return null;
  const label = isGroup ? await client.resolveGroupName(groupId!) : '私信';
  const avatar = qqAvatar(ev.sender.user_id);
  const nickname = ev.sender.nickname || String(ev.sender.user_id);
  const text = buildContent(ev.message, ev.raw_message);

  return {
    id: randomUUID(),
    kind: isGroup ? 'group' : 'private',
    label,
    avatar,
    nickname,
    text,
    createdAt: Date.now(),
    expiresAt: 0,
    special: !isGroup && client.isSpecialCare(ev.sender.user_id)
  };
}

export async function normalizeNoticeEvent(
  ev: OB11NoticeEvent,
  settings: AppSettings,
  client: OneBotClient
): Promise<BannerItem | null> {
  if (!settings.showNotice) return null;
  const noticeType = ev.notice_type;
  const groupId = ev.group_id;
  if (!groupId) return null;
  if (client.isGroupDnd(groupId)) return null;

  const label = await client.resolveGroupName(groupId);
  const userId = ev.user_id || ev.operator_id || 0;
  const avatar = qqAvatar(userId || 10000);

  let text = '群通知';
  const subType = ev.sub_type || '';

  try {
    if (noticeType === 'group_increase') {
      const name = await client.resolveMemberName(groupId, ev.user_id || 0);
      if (ev.operator_id && ev.operator_id !== ev.user_id) {
        const op = await client.resolveMemberName(groupId, ev.operator_id);
        text = op + ' 邀请 ' + name + ' 加入了群聊';
      } else {
        text = name + ' 加入了群聊';
      }
    } else if (noticeType === 'group_decrease') {
      const name = await client.resolveMemberName(groupId, ev.user_id || 0);
      if (subType === 'leave') {
        text = name + ' 退出了群聊';
      } else if (subType === 'kick') {
        const op = await client.resolveMemberName(groupId, ev.operator_id || 0);
        text = op + ' 将 ' + name + ' 移出了群聊';
      } else if (subType === 'kick_me') {
        const op = await client.resolveMemberName(groupId, ev.operator_id || 0);
        text = '你被 ' + op + ' 移出了群聊';
      } else {
        text = name + ' 离开了群聊';
      }
    } else if (noticeType === 'group_admin') {
      const name = await client.resolveMemberName(groupId, ev.user_id || 0);
      text = subType === 'set' ? name + ' 被设为管理员' : name + ' 被取消管理员';
    } else if (noticeType === 'group_ban') {
      const name = await client.resolveMemberName(groupId, ev.user_id || 0);
      text = subType === 'ban' ? name + ' 被禁言' : name + ' 被解除禁言';
    } else if (noticeType === 'group_recall') {
      const name = await client.resolveMemberName(groupId, ev.user_id || 0);
      text = name + ' 撤回了一条消息';
    }
  } catch {
    text = '收到一条群通知';
  }

  return {
    id: randomUUID(),
    kind: 'notice',
    label,
    avatar,
    nickname: '群通知',
    text,
    createdAt: Date.now(),
    expiresAt: 0
  };
}

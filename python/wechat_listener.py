#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""微信 4.x 消息监听器（wechatauto-replica 数据库监听）

向 stdout 逐行输出 JSON 事件，供 Electron 主进程读取。

可靠判定（实测微信 4.1.12.24）：
  - 自己：sender_username == 自己 wxid，或 real_sender_id == 自己在 SenderName2Id 的 rowid（本机为 1）；
  - 对方私聊：real_sender_id == 2（此时 sender_username 为空）；
  - 私聊 content 无前缀，对方即会话 username（1:1）；
  - 群聊 sender 藏在 content 前缀：`wxid_xxx: 内容` 或 `显示名: 内容`；
  - 群名、昵称从 contact.db 读取。
"""
import json
import os
import re
import sys
import time

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from wechatauto.db import WeChatDB, Listener

TYPE_MAP = {
    "文本": "text",
    "图片": "image",
    "语音": "voice",
    "视频": "video",
    "动画表情": "emoji",
    "位置": "location",
    "文件/链接/卡片": "file",
    "系统消息": "system",
}

PREFIX_RE = re.compile(r"^([^:\n]+):\s*\n?")


def emit(obj):
    try:
        sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
        sys.stdout.flush()
    except Exception:
        pass


def build_maps(db):
    """wxid -> 显示名，以及 显示名 -> wxid（用于群聊前缀为显示名时回查）。"""
    fwd = {}
    rev = {}
    try:
        for rel, path, _ in db._db_files:
            if path.endswith("contact.db"):
                conn = db._open(rel)
                try:
                    rows = conn.execute(
                        "SELECT username, nick_name, remark FROM contact"
                    ).fetchall()
                finally:
                    conn.close()
                for u, nick, remark in rows:
                    display = remark or nick or u
                    fwd[u] = display
                    if remark:
                        rev[remark] = u
                    if nick:
                        rev[nick] = u
                break
    except Exception:
        pass
    return fwd, rev


def parse_group_sender(content, fwd):
    """从群聊 content 前缀解析发送者显示名，返回 (显示名, 内容截断偏移)。"""
    m = PREFIX_RE.match(content)
    if not m:
        return "", 0
    prefix = m.group(1).strip()
    display = fwd.get(prefix, prefix)
    return display, m.end()


BUILTIN_USERNAMES = {
    "notifymessage",            # 服务通知
    "weixin",                   # 微信团队
    "medianote",                # 语音记事本
    "floatbottle",              # 漂流瓶
    "fmessage",                 # 朋友推荐消息
    "filehelper",               # 文件传输助手
    "brandsessionholder",       # 品牌会话占位
    "brandservicesessionholder",  # 品牌服务会话占位
    "qmessage",                 # QQ 离线消息
    "pc_share",                 # PC 分享
    "mediacenter",              # 媒体中心
    "newsapp",                  # 腾讯新闻
}


def build_filter_state(db):
    """构建免打扰/公众号/服务号/内置账号过滤表。

    返回 {"muted": set(), "blocked": set()}：
      - muted: SessionTable.status 命中 bit 2（4）的会话（群聊与私聊通用免打扰）；
      - blocked: 公众号(gh_)、服务号(verify_flag != 0)、服务通知(local_type == 0)、内置账号。
    """
    state = {"muted": set(), "blocked": set()}

    # 1) 会话级免打扰：SessionTable.status 的 bit 2（值 4）
    try:
        for rel, path, _ in db._db_files:
            if os.path.basename(path) == "session.db":
                conn = db._open(rel)
                try:
                    rows = conn.execute("SELECT username, status FROM SessionTable").fetchall()
                    for u, st in rows:
                        if u and st and (int(st) & 4):
                            state["muted"].add(u)
                finally:
                    conn.close()
                break
    except Exception:
        pass

    # 2) 公众号/服务号/服务通知/内置账号
    try:
        for rel, path, _ in db._db_files:
            if os.path.basename(path) == "contact.db":
                conn = db._open(rel)
                try:
                    rows = conn.execute(
                        "SELECT username, local_type, verify_flag FROM contact"
                    ).fetchall()
                    for u, lt, vf in rows:
                        u = u or ""
                        if not u:
                            continue
                        if u.startswith("gh_"):
                            state["blocked"].add(u)
                        elif (vf or 0) != 0:
                            state["blocked"].add(u)
                        elif (lt or 0) == 0:
                            state["blocked"].add(u)
                        elif u in BUILTIN_USERNAMES:
                            state["blocked"].add(u)
                finally:
                    conn.close()
                break
    except Exception:
        pass

    for u in BUILTIN_USERNAMES:
        state["blocked"].add(u)
    return state


def main():
    try:
        db = WeChatDB()
    except Exception as e:
        emit({"event": "error", "error": "无法初始化微信数据库: %r" % (e,)})
        return

    try:
        info = db.get_self_info()
    except Exception:
        info = {}
    self_wxid = str(info.get("username") or getattr(db, "wxid", "") or "")
    self_nick = str(info.get("nick_name") or "")
    emit({"event": "ready", "selfWxid": self_wxid, "nickname": self_nick})

    fwd, rev = build_maps(db)
    filter_state = build_filter_state(db)

    def should_block(user):
        if not user:
            return False
        st = filter_state
        if user in st.get("muted", ()):
            return True
        if user in st.get("blocked", ()):
            return True
        return False

    self_rowid = None
    try:
        for rel, path, _ in db._db_files:
            if path.endswith("message_resource.db"):
                conn = db._open(rel)
                try:
                    row = conn.execute(
                        "SELECT rowid FROM SenderName2Id WHERE user_name=? LIMIT 1",
                        (self_wxid,),
                    ).fetchone()
                    if row:
                        self_rowid = int(row[0])
                finally:
                    conn.close()
                break
    except Exception:
        self_rowid = None

    def resolve_nickname(wxid):
        return fwd.get(wxid, wxid)

    def on_msg(msg, lst):
        try:
            user = str(msg.get("username") or "")
            if should_block(user):
                return
            is_group = user.endswith("@chatroom")
            sender_id = msg.get("sender_id")
            sender_username = str(msg.get("sender_username") or "")
            is_self = (sender_username == self_wxid) or (
                self_rowid is not None and sender_id == self_rowid
            )
            content = str(msg.get("content") or "")

            nickname = ""
            sender = ""
            if is_group:
                # 群聊：发送者藏在 content 前缀
                if not is_self:
                    nickname, cut = parse_group_sender(content, fwd)
                    if cut:
                        content = content[cut:].lstrip("\n")
                    sender = rev.get(nickname, nickname)
                room_name = ""
                try:
                    room_name = db.get_nickname(user)
                except Exception:
                    room_name = ""
                if not room_name or room_name == user:
                    try:
                        room_name = db.group_id_to_name(user) or user
                    except Exception:
                        room_name = user
            else:
                # 私聊：对方即会话 username
                if not is_self:
                    sender = user
                    nickname = resolve_nickname(user)
                room_name = ""

            raw_type = str(msg.get("type") or "")
            mtype = TYPE_MAP.get(raw_type, "unknown")

            emit({
                "event": "message",
                "id": str(msg.get("local_id") or msg.get("sort_seq") or ""),
                "isSelf": bool(is_self),
                "isGroup": is_group,
                "roomid": user,
                "sender": sender,
                "nickname": nickname,
                "roomName": room_name,
                "type": mtype,
                "content": content,
                "ts": float(msg.get("create_time") or 0),
                "avatar": "",
                "selfWxid": self_wxid,
            })
        except Exception:
            pass

    lst = Listener(db, interval=1.0)
    try:
        lst.add_all(on_msg, discover=True)
        lst.start()
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        try:
            lst.stop()
        except Exception:
            pass


if __name__ == "__main__":
    main()

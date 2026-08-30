(function () {
  'use strict';

  const api = window.api;
  const BUILTIN_FACES = [
    { id: '14', name: '微笑' }, { id: '20', name: '呲牙' }, { id: '21', name: '难过' }, { id: '22', name: '抓狂' },
    { id: '23', name: '再见' }, { id: '24', name: '偷笑' }, { id: '25', name: '生气' }, { id: '26', name: '可爱' },
    { id: '27', name: '大哭' }, { id: '28', name: '困' }, { id: '29', name: '抱拳' }, { id: '30', name: '亲亲' },
    { id: '31', name: '害羞' }, { id: '32', name: '疑问' }, { id: '33', name: '晕' }, { id: '34', name: '阴险' },
    { id: '35', name: '奸笑' }, { id: '36', name: '苦笑' }, { id: '37', name: '委屈' }, { id: '38', name: '撇嘴' },
    { id: '39', name: '汗' }, { id: '40', name: '可怜' }, { id: '41', name: '色' }, { id: '42', name: '抠鼻' },
    { id: '43', name: '尴尬' }, { id: '44', name: '坏笑' }, { id: '45', name: '鼓掌' }, { id: '46', name: '惊喜' },
    { id: '47', name: '惊讶' }, { id: '48', name: '打哈欠' }, { id: '49', name: '生气' }, { id: '50', name: '得意' },
    { id: '51', name: '发怒' }, { id: '52', name: '调皮' }, { id: '53', name: '无聊' }, { id: '54', name: '左哼哼' },
    { id: '55', name: '右哼哼' }, { id: '56', name: '擦汗' }, { id: '57', name: '流泪' }, { id: '58', name: '大哭' },
    { id: '59', name: '敲打' }, { id: '60', name: '骷髅' }, { id: '61', name: '猪头' }, { id: '62', name: '菜刀' },
    { id: '63', name: '西瓜' }, { id: '64', name: '啤酒' }, { id: '65', name: '咖啡' }, { id: '66', name: '爱心' },
    { id: '67', name: '玫瑰' }, { id: '68', name: '凋谢' }, { id: '69', name: '嘴唇' }, { id: '70', name: '太阳' },
    { id: '71', name: '月亮' }, { id: '72', name: '星星' }, { id: '73', name: '闪电' }, { id: '74', name: '雨伞' },
    { id: '75', name: '下雨' }, { id: '76', name: '雪人' }, { id: '77', name: '微风' }, { id: '78', name: '白云' },
    { id: '81', name: '钱袋' }, { id: '82', name: '剪刀' }, { id: '83', name: '勾' }, { id: '84', name: '叉' },
    { id: '85', name: '电话' }, { id: '86', name: '信封' }, { id: '87', name: '礼物' }, { id: '88', name: '点赞' },
    { id: '89', name: '大便' }, { id: '90', name: '咖啡' }, { id: '91', name: '蛋糕' }, { id: '92', name: '篮球' },
    { id: '93', name: '足球' }, { id: '96', name: '网球' }, { id: '97', name: '台球' }, { id: '98', name: '乒乓球' },
    { id: '105', name: '自行车' }, { id: '106', name: '摩托车' }, { id: '107', name: '汽车' }, { id: '108', name: '飞机' },
    { id: '109', name: '火车' }, { id: '110', name: '轮船' }, { id: '111', name: '火箭' }, { id: '112', name: '奖杯' },
    { id: '113', name: '音乐' }, { id: '114', name: '话筒' }, { id: '115', name: '耳机' }, { id: '116', name: '相机' },
    { id: '117', name: '电视' }, { id: '118', name: '电脑' }, { id: '119', name: '手机' }, { id: '120', name: '钟表' },
    { id: '121', name: '闹钟' }, { id: '122', name: '购物' }, { id: '123', name: '灯泡' }, { id: '124', name: '书' },
    { id: '125', name: '铅笔' }, { id: '126', name: '放大镜' }, { id: '127', name: '锁' }, { id: '128', name: '钥匙' },
    { id: '133', name: '钱' }, { id: '134', name: '银行卡' }, { id: '136', name: '存钱罐' }, { id: '137', name: '房屋' },
    { id: '140', name: '酒' }, { id: '141', name: '茶' }, { id: '142', name: '酒杯' }, { id: '143', name: '筷子' },
    { id: '144', name: '饭' }, { id: '145', name: '鱼' }, { id: '146', name: '虾' }, { id: '147', name: '螃蟹' },
    { id: '148', name: '鸡腿' }, { id: '149', name: '汉堡' }, { id: '150', name: '薯条' }, { id: '151', name: '披萨' },
    { id: '152', name: '冰淇淋' }, { id: '153', name: '糖果' }, { id: '154', name: '巧克力' }, { id: '155', name: '爆米花' },
    { id: '156', name: '苹果' }, { id: '157', name: '香蕉' }, { id: '158', name: '葡萄' }, { id: '159', name: '草莓' },
    { id: '160', name: '橙子' }, { id: '161', name: '柠檬' }, { id: '162', name: '桃子' }, { id: '163', name: '樱桃' },
    { id: '164', name: '梨' }, { id: '166', name: '芒果' }, { id: '170', name: '树' }, { id: '178', name: '呲牙' },
    { id: '179', name: '打滚' }, { id: '180', name: '卖萌' }, { id: '182', name: '晕' }, { id: '184', name: '奸笑' },
    { id: '185', name: '坏笑' }, { id: '186', name: '鄙视' }, { id: '187', name: '斜眼' }, { id: '188', name: '发呆' },
    { id: '191', name: '鼓掌' }, { id: '192', name: '害羞' }, { id: '194', name: '祈祷' }, { id: '195', name: '握手' },
    { id: '196', name: '胜利' }, { id: '197', name: '弱' }, { id: '198', name: '拳头' }, { id: '199', name: '加油' },
    { id: '201', name: '抱抱' }, { id: '202', name: '飞吻' }, { id: '203', name: '爱心' }, { id: '204', name: '心碎' },
    { id: '212', name: '闪电' }, { id: '213', name: '彩虹' }, { id: '214', name: '礼物' }, { id: '215', name: '蛋糕' }
  ];

  const state = {
    convs: [],
    activeKey: null,
    activeConv: null,
    messages: [],
    selectMode: false,
    selectedIds: new Set(),
    quote: null,
    emojiTab: 'builtin',
    favEmoji: [],
    targets: [],
    forwardMode: 'single',
    pendingForwardIds: []
  };

  const el = {
    convList: document.getElementById('convList'),
    chatTitle: document.getElementById('chatTitle'),
    connState: document.getElementById('connState'),
    messages: document.getElementById('messages'),
    input: document.getElementById('input'),
    sendBtn: document.getElementById('sendBtn'),
    emojiBtn: document.getElementById('emojiBtn'),
    fileBtn: document.getElementById('fileBtn'),
    emojiPanel: document.getElementById('emojiPanel'),
    emojiGrid: document.getElementById('emojiGrid'),
    quoteBar: document.getElementById('quoteBar'),
    selectBar: document.getElementById('selectBar'),
    ctx: document.getElementById('contextMenu'),
    forwardMask: document.getElementById('forwardMask'),
    targetList: document.getElementById('targetList'),
    targetSearch: document.getElementById('targetSearch'),
    forwardOk: document.getElementById('forwardOk'),
    forwardCancel: document.getElementById('forwardCancel'),
    imageViewer: document.getElementById('imageViewer'),
    imageViewerImg: document.getElementById('imageViewerImg'),
    selfAvatar: document.getElementById('selfAvatar')
  };

  function faceUrl(id) { return 'https://cdn.jsdelivr.net/gh/GentleTK/cdn-assets@1.0.0/emoji/qq/qq-' + id + '.gif'; }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function fmtTime(ts) {
    if (!ts) return '';
    const d = new Date(ts); const now = new Date();
    const hh = String(d.getHours()).padStart(2, '0'); const mm = String(d.getMinutes()).padStart(2, '0');
    if (d.toDateString() === now.toDateString()) return hh + ':' + mm;
    const yest = new Date(now.getTime() - 86400000);
    if (d.toDateString() === yest.toDateString()) return '昨天 ' + hh + ':' + mm;
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + hh + ':' + mm;
  }
  function timeSep(ts) {
    const d = new Date(ts); const now = new Date();
    const hh = String(d.getHours()).padStart(2, '0'); const mm = String(d.getMinutes()).padStart(2, '0');
    if (d.toDateString() === now.toDateString()) return hh + ':' + mm;
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hh + ':' + mm;
  }

  function renderConvList() {
    el.convList.innerHTML = '';
    for (const c of state.convs) {
      const item = document.createElement('div');
      item.className = 'conv-item' + (c.pinned ? ' pinned' : '') + (c.dnd ? ' dnd' : '') + (c.key === state.activeKey ? ' active' : '');
      item.dataset.key = c.key;
      const avatar = document.createElement('div');
      avatar.className = 'conv-avatar';
      avatar.style.backgroundImage = 'url(' + c.avatar + ')';
      const body = document.createElement('div');
      body.className = 'conv-body';
      const top = document.createElement('div'); top.className = 'conv-top';
      const title = document.createElement('span'); title.className = 'conv-title'; title.textContent = c.title;
      const time = document.createElement('span'); time.className = 'conv-time'; time.textContent = fmtTime(c.lastTs);
      top.appendChild(title); top.appendChild(time);
      const bottom = document.createElement('div'); bottom.className = 'conv-bottom';
      const preview = document.createElement('span'); preview.className = 'conv-preview';
      const src = c.peer.kind === 'group' ? '群聊' : '私聊';
      preview.textContent = (c.unread > 0 ? '[新] ' : '') + src + ' · ' + (c.lastText || '');
      bottom.appendChild(preview);
      if (c.unread > 0) {
        const badge = document.createElement('span'); badge.className = 'conv-badge'; badge.textContent = c.unread > 99 ? '99+' : c.unread;
        bottom.appendChild(badge);
      }
      body.appendChild(top); body.appendChild(bottom);
      item.appendChild(avatar); item.appendChild(body);
      item.addEventListener('click', function () { openConversation(c.key); });
      item.addEventListener('contextmenu', function (e) { e.preventDefault(); showConvContextMenu(e, c); });
      el.convList.appendChild(item);
    }
  }

  function openConversation(key) {
    state.activeKey = key;
    state.activeConv = state.convs.find(function (c) { return c.key === key; }) || null;
    state.messages = []; state.quote = null; state.selectMode = false; state.selectedIds.clear();
    updateSelectBar(); renderQuoteBar(); renderConvList();
    if (state.activeConv) {
      el.chatTitle.textContent = state.activeConv.title + (state.activeConv.memberCount ? '（' + state.activeConv.memberCount + '）' : '');
    }
    api.chatHistory({ key: key, limit: 100 }).then(function (msgs) {
      if (state.activeKey !== key) return;
      state.messages = msgs; renderMessages(); scrollBottom();
    });
    api.chatMarkRead(key);
  }

  function renderMessages() {
    el.messages.innerHTML = '';
    let lastSep = ''; let lastSender = ''; let lastDir = '';
    state.messages.forEach(function (m) {
      const sep = timeSep(m.ts);
      if (sep !== lastSep) { const s = document.createElement('div'); s.className = 'time-sep'; s.textContent = sep; el.messages.appendChild(s); lastSep = sep; }
      const merged = (lastSender === m.senderUserId && lastDir === m.direction);
      lastSender = m.senderUserId; lastDir = m.direction;
      el.messages.appendChild(renderRow(m, merged));
    });
    if (!state.messages.length) { const t = document.createElement('div'); t.className = 'empty-tip'; t.textContent = '暂无消息'; el.messages.appendChild(t); }
  }

  function renderRow(m, merged) {
    const row = document.createElement('div');
    row.className = 'row ' + m.direction;
    row.dataset.id = m.id;
    row.dataset.messageId = m.messageId || '';
    if (state.selectMode) {
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'msg-check';
      cb.checked = state.selectedIds.has(m.id);
      cb.addEventListener('click', function (e) { e.stopPropagation(); });
      cb.addEventListener('change', function () { if (cb.checked) state.selectedIds.add(m.id); else state.selectedIds.delete(m.id); });
      row.appendChild(cb);
    }
    if (!merged) {
      const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.style.backgroundImage = 'url(' + (m.avatar || '') + ')';
      avatar.addEventListener('click', function () { openImageViewer(m.avatar); });
      row.appendChild(avatar);
    } else {
      const spacer = document.createElement('div'); spacer.className = 'avatar'; spacer.style.visibility = 'hidden'; row.appendChild(spacer);
    }
    const wrap = document.createElement('div'); wrap.className = 'msg-wrap';
    if (!merged) { const nick = document.createElement('div'); nick.className = 'nick'; nick.textContent = m.senderName || ''; wrap.appendChild(nick); }
    const bubble = document.createElement('div'); bubble.className = 'bubble' + (m.recalled ? ' recalled' : '');
    if (m.recalled) { bubble.textContent = '你撤回了一条消息'; }
    else { renderBubble(bubble, m); if (m.voiceText) { const vt = document.createElement('div'); vt.className = 'voice-text'; vt.textContent = m.voiceText; bubble.appendChild(vt); } }
    wrap.appendChild(bubble); row.appendChild(wrap);
    row.addEventListener('click', function (e) {
      if (state.selectMode) {
        const cb = row.querySelector('.msg-check');
        if (cb) { if (cb.checked) { cb.checked = false; state.selectedIds.delete(m.id); } else { cb.checked = true; state.selectedIds.add(m.id); } }
      }
    });
    row.addEventListener('contextmenu', function (e) { e.preventDefault(); showMsgContextMenu(e, m); });
    return row;
  }

  function renderBubble(bubble, m) {
    (m.segments || []).forEach(function (seg) {
      const d = seg.data || {};
      if (seg.type === 'text') { if (d.text) bubble.appendChild(document.createTextNode(d.text)); }
      else if (seg.type === 'face') {
        if (d.url) { appendImg(bubble, d.url, 'face'); }
        else if (d.id && /^\d+$/.test(d.id) && Number(d.id) < 1000) { appendImg(bubble, faceUrl(d.id), 'face'); }
        else { const s = document.createElement('span'); s.textContent = '[表情]'; bubble.appendChild(s); }
      }
      else if (seg.type === 'mface') { appendImg(bubble, d.url || '', 'face'); }
      else if (seg.type === 'image') { appendImg(bubble, d.url || d.file || '', 'msg-img'); }
      else if (seg.type === 'record') { const a = document.createElement('audio'); a.controls = true; a.src = d.url || d.file || ''; bubble.appendChild(a); }
      else if (seg.type === 'file') {
        const card = document.createElement('div'); card.className = 'file-card';
        card.innerHTML = '<span class="file-name">' + escapeHtml(d.name || d.file || '文件') + '</span>';
        card.addEventListener('click', function () { openFile(m, seg); });
        bubble.appendChild(card);
      }
      else if (seg.type === 'video') { const s = document.createElement('span'); s.textContent = '[视频]'; bubble.appendChild(s); }
      else if (seg.type === 'at') { const s = document.createElement('span'); s.textContent = '@' + (d.qq || d.name || ''); bubble.appendChild(s); }
      else if (seg.type === 'reply') { const q = document.createElement('div'); q.className = 'reply-quote'; q.textContent = '引用回复'; bubble.appendChild(q); }
      else if (seg.type === 'forward') { const s = document.createElement('span'); s.textContent = '[合并转发]'; bubble.appendChild(s); }
    });
  }
  function appendImg(bubble, src, cls) {
    if (!src) return;
    const img = document.createElement('img'); img.className = cls; img.src = src;
    img.onerror = function () { const s = document.createElement('span'); s.textContent = '[表情]'; img.replaceWith(s); };
    if (cls === 'msg-img') img.addEventListener('click', function () { openImageViewer(src); });
    bubble.appendChild(img);
  }

  function openFile(m, seg) {
    const d = seg.data || {};
    if (m.localFilePath) { api.chatOpenPath(m.localFilePath); return; }
    if (d.file && /^([A-Za-z]:[\\/]|file:)/.test(d.file)) { api.chatOpenPath(d.file); return; }
    if (d.url) { api.openExternal(d.url); }
  }
  function openImageViewer(src) { if (!src) return; el.imageViewerImg.src = src; el.imageViewer.hidden = false; }
  function scrollBottom() { el.messages.scrollTop = el.messages.scrollHeight; }

  function renderQuoteBar() {
    if (state.quote) {
      el.quoteBar.hidden = false;
      el.quoteBar.innerHTML = '<span>' + escapeHtml('回复：' + (state.quote.plainText || '').slice(0, 40)) + '</span><button id="quoteCancel">取消</button>';
      document.getElementById('quoteCancel').addEventListener('click', function () { state.quote = null; renderQuoteBar(); });
    } else { el.quoteBar.hidden = true; el.quoteBar.innerHTML = ''; }
  }
  function updateSelectBar() { el.selectBar.hidden = !state.selectMode; }

  function collectInputSegs(node, segs) {
    Array.from(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { if (n.textContent) segs.push({ type: 'text', data: { text: n.textContent } }); }
      else if (n.nodeType === 1) {
        if (n.tagName === 'BR') { segs.push({ type: 'text', data: { text: '\n' } }); }
        else if (n.classList && n.classList.contains('input-face')) { segs.push({ type: 'face', data: { id: n.dataset.id } }); }
        else if (n.classList && n.classList.contains('pasted-img')) { const b = (n.dataset.file || '').replace(/^data:[^,]+,/, ''); segs.push({ type: 'image', data: { file: 'base64://' + b } }); }
        else { collectInputSegs(n, segs); }
      }
    });
  }
  function mergeSegments(segs) {
    const out = [];
    for (const s of segs) {
      if (s.type === 'text') {
        const last = out[out.length - 1];
        if (last && last.type === 'text') last.data.text += s.data.text; else out.push(s);
      } else out.push(s);
    }
    return out.filter(function (s) { return !(s.type === 'text' && !(s.data.text || '').trim()); });
  }

  async function send() {
    if (!state.activeConv) return;
    const raw = [];
    collectInputSegs(el.input, raw);
    const segments = mergeSegments(raw);
    if (!segments.length) return;
    if (state.quote) { if (state.quote.messageId) segments.unshift({ type: 'reply', data: { id: String(state.quote.messageId) } }); state.quote = null; renderQuoteBar(); }
    const res = await api.chatSend({ peer: state.activeConv.peer, segments: segments });
    if (!res.ok) alert('发送失败：' + (res.error || '未知错误')); else el.input.innerHTML = '';
  }

  function buildEmojiGrid() {
    el.emojiGrid.innerHTML = '';
    el.emojiGrid.classList.toggle('fav', state.emojiTab === 'fav');
    if (state.emojiTab === 'builtin') {
      BUILTIN_FACES.forEach(function (f) {
        const img = document.createElement('img'); img.src = faceUrl(f.id); img.title = f.name;
        img.onerror = function () { img.alt = f.name; img.src = ''; };
        img.addEventListener('click', function () { insertFace(f); });
        el.emojiGrid.appendChild(img);
      });
    } else {
      if (!state.favEmoji.length) { const tip = document.createElement('div'); tip.style.cssText = 'grid-column:1/-1;color:#999;font-size:12px;'; tip.textContent = '正在加载收藏表情…'; el.emojiGrid.appendChild(tip); }
      state.favEmoji.forEach(function (e) {
        const img = document.createElement('img'); img.src = e.url; img.title = e.desc || '';
        img.addEventListener('click', function () { insertFavEmoji(e); });
        el.emojiGrid.appendChild(img);
      });
    }
  }

  function insertFace(f) {
    if (!state.activeConv) return;
    const img = document.createElement('img');
    img.className = 'input-face'; img.dataset.id = f.id; img.src = faceUrl(f.id); img.alt = f.name || '表情'; img.contentEditable = 'false';
    el.input.appendChild(img);
    const range = document.createRange(); range.setStartAfter(img); range.collapse(true);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); el.input.focus();
  }

  async function insertFavEmoji(e) {
    if (!state.activeConv) return;
    const img = document.createElement('img');
    img.className = 'pasted-img'; img.dataset.file = e.url; img.src = e.url; img.contentEditable = 'false';
    el.input.appendChild(img);
    const range = document.createRange(); range.setStartAfter(img); range.collapse(true);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); el.input.focus();
  }

  function showMsgContextMenu(e, m) {
    const items = [];
    if (m.plainText || hasTextSegment(m)) items.push({ label: '复制', fn: function () { copyText(m); } });
    items.push({ label: '引用', fn: function () { state.quote = m; renderQuoteBar(); } });
    if (m.direction === 'out' && m.messageId && Date.now() - m.ts < 120000) items.push({ label: '撤回', fn: function () { recall(m); } });
    if (hasRecordSegment(m) && m.messageId) items.push({ label: '转文字', fn: function () { voiceToText(m); } });
    items.push({ label: '多选', fn: function () { state.selectMode = true; updateSelectBar(); renderMessages(); } });
    showContextMenu(e.clientX, e.clientY, items);
  }
  function hasTextSegment(m) { return (m.segments || []).some(function (s) { return s.type === 'text' && s.data && s.data.text; }); }
  function hasRecordSegment(m) { return (m.segments || []).some(function (s) { return s.type === 'record'; }); }

  function showConvContextMenu(e, c) {
    const items = [
      { label: c.pinned ? '取消置顶' : '置顶', fn: function () { api.chatPinConversation(c.key, !c.pinned); } },
      { label: '标记已读', fn: function () { api.chatMarkRead(c.key); } },
      { label: '删除聊天记录', fn: function () { if (confirm('删除该会话的本地聊天记录？')) api.chatDeleteHistory(c.key); } }
    ];
    showContextMenu(e.clientX, e.clientY, items);
  }
  function showContextMenu(x, y, items) {
    el.ctx.innerHTML = '';
    items.forEach(function (it) { const b = document.createElement('button'); b.textContent = it.label; b.addEventListener('click', function () { hideContextMenu(); it.fn(); }); el.ctx.appendChild(b); });
    el.ctx.hidden = false;
    const w = 160;
    el.ctx.style.left = Math.min(x, window.innerWidth - w) + 'px';
    el.ctx.style.top = Math.min(y, window.innerHeight - items.length * 36 - 8) + 'px';
  }
  function hideContextMenu() { el.ctx.hidden = true; }
  function copyText(m) {
    const txt = (m.segments || []).filter(function (s) { return s.type === 'text'; }).map(function (s) { return s.data.text || ''; }).join('');
    api.clipboardWriteText(txt);
  }
  async function recall(m) { const res = await api.chatRecall({ peer: m.peer, localId: m.id, messageId: m.messageId }); if (!res.ok) alert('撤回失败：' + (res.error || '')); }
  async function voiceToText(m) {
    const res = await api.chatVoiceToText({ peer: m.peer, localId: m.id, messageId: m.messageId });
    if (res.ok && res.text) { m.voiceText = res.text; renderMessages(); scrollBottom(); } else alert('转文字失败：' + (res.error || ''));
  }

  async function openForwardModal(mode, ids) {
    state.forwardMode = mode; state.pendingForwardIds = ids;
    el.forwardMask.hidden = false; el.targetSearch.value = '';
    if (!state.targets.length) state.targets = await api.chatTargets();
    renderTargets();
  }
  function convOrderIndex(kind, id) {
    const idx = state.convs.findIndex(function (c) { return c.peer.kind === kind && c.peer.id === id; });
    return idx < 0 ? 999999 : idx;
  }
  function renderTargets() {
    el.targetList.innerHTML = '';
    const q = el.targetSearch.value.toLowerCase();
    const list = state.targets.slice().sort(function (a, b) { return convOrderIndex(a.kind, a.id) - convOrderIndex(b.kind, b.id); });
    list.filter(function (t) { return t.name.toLowerCase().includes(q); }).forEach(function (t) {
      const item = document.createElement('div');
      item.className = 'target-item'; item.dataset.kind = t.kind; item.dataset.id = t.id;
      item.textContent = (t.kind === 'group' ? '[群] ' : '[好友] ') + t.name;
      item.addEventListener('click', function () { item.classList.toggle('selected'); });
      el.targetList.appendChild(item);
    });
  }
  function selectedTargets() {
    return Array.from(el.targetList.querySelectorAll('.target-item.selected')).map(function (n) { return { kind: n.dataset.kind, id: Number(n.dataset.id), name: '' }; });
  }
  async function doForward(mode) {
    const ids = (state.pendingForwardIds || []).map(function (i) { return state.messages.find(function (m) { return m.id === i; }); }).filter(Boolean).map(function (m) { return m.messageId; }).filter(Boolean);
    const targets = selectedTargets();
    if (!ids.length || !targets.length) { alert('请选择消息与目标'); return; }
    const res = await api.chatForward({ peer: state.activeConv.peer, targets: targets, messageIds: ids, mode: mode });
    if (!res.ok) alert('转发失败：' + (res.error || '')); else { el.forwardMask.hidden = true; exitSelect(); }
  }
  function exitSelect() { state.selectMode = false; state.selectedIds.clear(); updateSelectBar(); renderMessages(); }

  function wire() {
    el.sendBtn.addEventListener('click', send);
    el.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    el.input.addEventListener('paste', function (e) {
      const items = (e.clipboardData && e.clipboardData.items) ? Array.from(e.clipboardData.items) : [];
      const imageItem = items.find(function (it) { return it.kind === 'file' && it.type.indexOf('image/') === 0; });
      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        const reader = new FileReader();
        reader.onload = function () {
          const img = document.createElement('img'); img.className = 'pasted-img'; img.dataset.file = reader.result; img.src = reader.result; img.contentEditable = 'false';
          el.input.appendChild(img);
          const range = document.createRange(); range.setStartAfter(img); range.collapse(true);
          const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); el.input.focus();
        };
        reader.readAsDataURL(file);
      }
    });
    el.emojiBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      el.emojiPanel.hidden = !el.emojiPanel.hidden;
      if (!el.emojiPanel.hidden) buildEmojiGrid();
    });
    el.emojiPanel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { if (!el.emojiPanel.hidden) el.emojiPanel.hidden = true; });
    el.fileBtn.addEventListener('click', async function () {
      if (!state.activeConv) return;
      const r = await api.chatPickFile();
      if (r.ok && r.path) {
        const res = await api.chatSend({ peer: state.activeConv.peer, segments: [{ type: 'file', data: { file: r.path } }] });
        if (!res.ok) alert('发送失败：' + (res.error || ''));
      }
    });
    document.querySelectorAll('.emoji-tabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.emoji-tabs button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active'); state.emojiTab = b.dataset.tab;
        if (state.emojiTab === 'fav') { api.emojiFavorites().then(function (list) { state.favEmoji = list || []; buildEmojiGrid(); }); }
        else buildEmojiGrid();
      });
    });
    document.getElementById('forwardSingleBtn').addEventListener('click', function () { openForwardModal('single', Array.from(state.selectedIds)); });
    document.getElementById('forwardMergeBtn').addEventListener('click', function () { openForwardModal('merge', Array.from(state.selectedIds)); });
    document.getElementById('deleteSelectedBtn').addEventListener('click', async function () {
      const ids = Array.from(state.selectedIds);
      if (ids.length && state.activeConv) { await api.chatDeleteMessages({ peer: state.activeConv.peer, localIds: ids }); exitSelect(); await refreshActive(); }
    });
    document.getElementById('cancelSelectBtn').addEventListener('click', exitSelect);
    el.forwardOk.addEventListener('click', function () { doForward(state.forwardMode); });
    el.forwardCancel.addEventListener('click', function () { el.forwardMask.hidden = true; });
    el.forwardMask.addEventListener('click', function (e) { if (e.target === el.forwardMask) el.forwardMask.hidden = true; });
    el.targetSearch.addEventListener('input', renderTargets);
    el.imageViewer.addEventListener('click', function () { el.imageViewer.hidden = true; });
    document.addEventListener('click', function (e) { if (!el.ctx.contains(e.target)) hideContextMenu(); });
  }

  async function refreshActive() {
    if (state.activeKey) { state.messages = await api.chatHistory({ key: state.activeKey, limit: 100 }); renderMessages(); }
  }

  function init() {
    window.addEventListener('error', function (e) { console.log('DASH_ERROR', e.message, e.filename, e.lineno); });
    window.addEventListener('unhandledrejection', function (e) { console.log('DASH_REJECTION', e.reason); });
    api.chatList().then(function (list) { state.convs = list || []; renderConvList(); });
    api.emojiFavorites().then(function (list) { state.favEmoji = list || []; });
    api.onChatConversations(function (list) { state.convs = list || []; if (state.activeKey) state.activeConv = state.convs.find(function (c) { return c.key === state.activeKey; }) || null; renderConvList(); });
    api.onChatMessage(function (m) {
      const active = state.activeConv;
      if (active && m.peer.kind === active.peer.kind && m.peer.id === active.peer.id) {
        state.messages.push(m); renderMessages(); scrollBottom(); api.chatMarkRead(state.activeKey);
      }
    });
    api.onChatUnread(function () {});
    api.onConnectionState(function (s) { el.connState.textContent = s.message; el.connState.classList.toggle('on', s.connected); });
    wire();
  }

  init();
})();

const titleEl = document.getElementById('subTitle');
const qqOnly = document.querySelector('.qq-only');
const wechatOnly = document.querySelector('.wechat-only');
const scopeSpecialPrivate = document.getElementById('scopeSpecialPrivate');
const scopeNormalPrivate = document.getElementById('scopeNormalPrivate');
const scopeNormalGroup = document.getElementById('scopeNormalGroup');
const wechatPrivate = document.getElementById('wechatPrivate');
const wechatGroup = document.getElementById('wechatGroup');

let currentKind = 'qq';
let currentScope = null;

function applyScope(s) {
  if (!s) return;
  currentScope = s;
  scopeSpecialPrivate.checked = s.scopeSpecialPrivate !== false;
  scopeNormalPrivate.checked = s.scopeNormalPrivate !== false;
  scopeNormalGroup.checked = s.scopeNormalGroup !== false;
  wechatPrivate.checked = s.wechatPrivate !== false;
  wechatGroup.checked = s.wechatGroup !== false;
}

function applyKind(kind) {
  currentKind = kind === 'wechat' ? 'wechat' : 'qq';
  const isQq = currentKind === 'qq';
  titleEl.textContent = window.__t(isQq ? 'submenu.scope' : 'submenu.wechat');
  qqOnly.classList.toggle('hidden', !isQq);
  wechatOnly.classList.toggle('hidden', isQq);
}

function render() {
  applyKind(currentKind);
  if (currentScope) applyScope(currentScope);
}

window.__i18nReady.then(render);

if (window.api && window.api.onTraySubmenuData) {
  window.api.onTraySubmenuData(function (data) {
    if (!data) return;
    currentKind = data.kind;
    currentScope = data.scope;
    render();
  });
}

function bindChange(id, key) {
  document.getElementById(id).addEventListener('change', function () {
    if (!window.api || !window.api.traySetScope) return;
    const patch = {};
    patch[key] = this.checked;
    window.api.traySetScope(patch).then(applyScope).catch(function () {});
  });
}

bindChange('scopeSpecialPrivate', 'scopeSpecialPrivate');
bindChange('scopeNormalPrivate', 'scopeNormalPrivate');
bindChange('scopeNormalGroup', 'scopeNormalGroup');
bindChange('wechatPrivate', 'wechatPrivate');
bindChange('wechatGroup', 'wechatGroup');

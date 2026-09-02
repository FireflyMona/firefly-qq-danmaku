const fields = {
  wsUrl: document.getElementById('wsUrl'),
  token: document.getElementById('token'),
  reconnectMs: document.getElementById('reconnectMs'),
  widthPercent: document.getElementById('widthPercent'),
  maxHeightPercent: document.getElementById('maxHeightPercent'),
  fontSize: document.getElementById('fontSize'),
  opacity: document.getElementById('opacity'),
  secondsPerLine: document.getElementById('secondsPerLine'),
  showPrivate: document.getElementById('showPrivate'),
  showGroup: document.getElementById('showGroup'),
  showNotice: document.getElementById('showNotice'),
  enableWechat: document.getElementById('enableWechat'),
  language: document.getElementById('language')
};
const connEl = document.getElementById('conn');
const wechatConnEl = document.getElementById('wechatConn');
const savedEl = document.getElementById('saved');

let currentSettings = null;

function fill(settings) {
  currentSettings = settings;
  fields.wsUrl.value = settings.wsUrl;
  fields.token.value = settings.token || '';
  fields.reconnectMs.value = settings.reconnectMs;
  fields.widthPercent.value = settings.widthPercent;
  fields.maxHeightPercent.value = settings.maxHeightPercent;
  fields.fontSize.value = settings.fontSize;
  fields.opacity.value = settings.opacity;
  fields.secondsPerLine.value = settings.secondsPerLine;
  fields.showPrivate.checked = settings.showPrivate;
  fields.showGroup.checked = settings.showGroup;
  fields.showNotice.checked = settings.showNotice;
  fields.enableWechat.checked = !!settings.enableWechat;
  fields.language.value = settings.language === 'en' ? 'en' : 'zh';
  wechatConnEl.textContent = settings.enableWechat ? window.__t('settings.wechatStarting') : window.__t('settings.wechatDisabled');
}

function read() {
  return {
    wsUrl: fields.wsUrl.value.trim() || 'ws://127.0.0.1:3001',
    token: fields.token.value,
    reconnectMs: Number(fields.reconnectMs.value) || 3000,
    widthPercent: Number(fields.widthPercent.value) || 33,
    maxHeightPercent: Number(fields.maxHeightPercent.value) || 25,
    fontSize: Number(fields.fontSize.value) || 16,
    opacity: Number(fields.opacity.value) || 0.92,
    secondsPerLine: Number(fields.secondsPerLine.value) || 5,
    showPrivate: fields.showPrivate.checked,
    showGroup: fields.showGroup.checked,
    showNotice: fields.showNotice.checked,
    enableWechat: fields.enableWechat.checked,
    language: fields.language.value === 'en' ? 'en' : 'zh',
    scopeSpecialPrivate: currentSettings ? currentSettings.scopeSpecialPrivate : true,
    scopeNormalPrivate: currentSettings ? currentSettings.scopeNormalPrivate : true,
    scopeNormalGroup: currentSettings ? currentSettings.scopeNormalGroup : true,
    wechatPrivate: currentSettings ? currentSettings.wechatPrivate : true,
    wechatGroup: currentSettings ? currentSettings.wechatGroup : true
  };
}

async function load() {
  const settings = await window.api.getSettings();
  fill(settings);
}

document.getElementById('form').addEventListener('submit', async function (event) {
  event.preventDefault();
  await window.api.saveSettings(read());
  savedEl.hidden = false;
  setTimeout(function () { savedEl.hidden = true; }, 1800);
});

fields.language.addEventListener('change', async function () {
  const lang = fields.language.value === 'en' ? 'en' : 'zh';
  if (currentSettings) currentSettings.language = lang;
  if (window.api && window.api.setLanguage) {
    await window.api.setLanguage(lang);
  }
  await window.__setLang(lang);
  wechatConnEl.textContent = fields.enableWechat.checked ? window.__t('settings.wechatStarting') : window.__t('settings.wechatDisabled');
});

window.api.onConnectionState(function (state) {
  connEl.textContent = state.message;
  connEl.classList.toggle('on', state.connected);
});
window.api.onWechatState(function (info) {
  wechatConnEl.textContent = info.message || '';
  wechatConnEl.classList.toggle('on', !!info.loggedIn);
});

window.__i18nReady.then(load);

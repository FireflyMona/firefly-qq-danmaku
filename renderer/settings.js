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
  showNotice: document.getElementById('showNotice')
};
const connEl = document.getElementById('conn');
const savedEl = document.getElementById('saved');

function fill(settings) {
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
    showNotice: fields.showNotice.checked
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
window.api.onConnectionState(function (state) {
  connEl.textContent = state.message;
  connEl.classList.toggle('on', state.connected);
});
load();

const langEl = document.getElementById('lang');
const guideEl = document.getElementById('guide');
const riskEl = document.getElementById('risk');
const envEl = document.getElementById('env');
const installEl = document.getElementById('installSection');
const statusEl = document.getElementById('status');
const recheckBtn = document.getElementById('recheck');
const installBtn = document.getElementById('install');
const agreeBtn = document.getElementById('agreeBtn');
const guideNext = document.getElementById('guideNext');
const zhBtn = document.getElementById('zhBtn');
const enBtn = document.getElementById('enBtn');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const doneEl = document.getElementById('done');
const autostartState = document.getElementById('autostartState');
const autostartBtn = document.getElementById('autostartBtn');
const finishBtn = document.getElementById('finish');
const installError = document.getElementById('installError');

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function setStep(name) {
  langEl.classList.toggle('hidden', name !== 'lang');
  guideEl.classList.toggle('hidden', name !== 'guide');
  riskEl.classList.toggle('hidden', name !== 'risk');
  envEl.classList.toggle('hidden', name !== 'env');
  installEl.classList.toggle('hidden', name !== 'install');
  document.querySelectorAll('.steps .step').forEach(function (el) {
    el.classList.toggle('active', el.dataset.step === name);
  });
}

function symbol(r) {
  return r.ok ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>';
}

function render(results) {
  statusEl.innerHTML = '';
  for (const r of results) {
    const card = document.createElement('div');
    card.className = 'card ' + r.level + (r.required ? ' required' : '');
    let html = '<div class="head">' + symbol(r) + '<h3>' + escapeHtml(r.title) + (r.required ? ' <span class="req">*</span>' : '') + '</h3></div>';
    html += '<p class="detail">' + escapeHtml(r.detail) + '</p>';
    html += '<p class="guidance">' + escapeHtml(r.guidance) + '</p>';
    if (r.link) {
      html += '<a class="link" data-url="' + escapeHtml(r.link) + '">' + window.__t('installer.openGuide') + '</a>';
    }
    card.innerHTML = html;
    const link = card.querySelector('a.link');
    if (link) link.addEventListener('click', function () { window.api.openExternal(link.dataset.url); });
    statusEl.appendChild(card);
  }

  const required = results.filter(function (r) { return r.required; });
  const corePass = required.length > 0 && required.every(function (r) { return r.ok; });
  installBtn.disabled = !corePass;
}

async function runCheck() {
  statusEl.innerHTML = '<div class="loading">' + window.__t('installer.loading') + '</div>';
  installBtn.disabled = true;
  try {
    const results = await window.api.envCheck();
    render(results);
  } catch (err) {
    statusEl.innerHTML = '<div class="loading">' + window.__t('installer.checkFailPrefix') + escapeHtml(String(err)) + '</div>';
  }
}

async function refreshAutostart() {
  try {
    const on = await window.api.getAutostart();
    autostartState.textContent = on ? '✓' : '✗';
    autostartState.className = 'autostart-state ' + (on ? 'ok' : 'bad');
  } catch {
    autostartState.textContent = '✗';
    autostartState.className = 'autostart-state bad';
  }
}

async function selectLanguage(lang) {
  const next = lang === 'en' ? 'en' : 'zh';
  if (window.api && window.api.setLanguage) {
    await window.api.setLanguage(next);
  }
  await window.__setLang(next);
  zhBtn.classList.toggle('active', next === 'zh');
  enBtn.classList.toggle('active', next === 'en');
  setStep('guide');
}

zhBtn.addEventListener('click', function () { selectLanguage('zh'); });
enBtn.addEventListener('click', function () { selectLanguage('en'); });

guideNext.addEventListener('click', function () { setStep('risk'); });

agreeBtn.addEventListener('click', function () {
  setStep('env');
  runCheck();
});

recheckBtn.addEventListener('click', function () { runCheck(); });

// 绑定插件准备页与其它 data-url 链接
document.querySelectorAll('a.link[data-url]').forEach(function (a) {
  a.addEventListener('click', function () { window.api.openExternal(a.dataset.url); });
});

installBtn.addEventListener('click', async function () {
  installBtn.disabled = true;
  setStep('install');
  progressWrap.classList.remove('hidden');
  doneEl.classList.add('hidden');
  installError.classList.add('hidden');
  progressBar.style.width = '0%';
  progressText.textContent = window.__t('installer.preparing');
  try {
    const res = await window.api.install();
    if (res.ok) {
      progressBar.style.width = '100%';
      progressText.textContent = window.__t('installer.progressDone');
      setTimeout(function () {
        progressWrap.classList.add('hidden');
        doneEl.classList.remove('hidden');
        finishBtn.disabled = false;
        refreshAutostart();
      }, 350);
    } else {
      installError.textContent = window.__t('installer.failPrefix') + (res.error || window.__t('installer.unknownError'));
      installError.classList.remove('hidden');
      progressWrap.classList.add('hidden');
      installBtn.disabled = false;
    }
  } catch (err) {
    installError.textContent = window.__t('installer.failPrefix') + String(err);
    installError.classList.remove('hidden');
    progressWrap.classList.add('hidden');
    installBtn.disabled = false;
  }
});

if (window.api && window.api.onInstallProgress) {
  window.api.onInstallProgress(function (data) {
    if (!data) return;
    const pct = Math.max(0, Math.min(100, Number(data.percent) || 0));
    progressBar.style.width = pct + '%';
    progressText.textContent = data.text || '';
  });
}

autostartBtn.addEventListener('click', async function () {
  try {
    const ok = await window.api.setAutostart(true);
    if (ok) {
      autostartState.textContent = '✓';
      autostartState.className = 'autostart-state ok';
    }
  } catch {
    autostartState.textContent = '✗';
    autostartState.className = 'autostart-state bad';
  }
});

finishBtn.addEventListener('click', function () {
  if (window.api && window.api.finishInstall) {
    window.api.finishInstall();
  }
});

setStep('lang');
window.__i18nReady.then(async function () {
  if (window.api && window.api.getLanguage) {
    const lang = await window.api.getLanguage();
    const isEn = lang === 'en';
    zhBtn.classList.toggle('active', !isEn);
    enBtn.classList.toggle('active', isEn);
  }
});

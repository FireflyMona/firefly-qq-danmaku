/* 共享渲染层 i18n 帮助脚本。用法：
   - 页面在 body 底部先引入本脚本，再引入页面脚本。
   - 静态文案：给元素加 data-i18n="key"（文本）、data-i18n-placeholder="key"（占位符）。
   - 动态文案：调用 window.__t('key', {name: value})。
   - 需要等就绪时：await window.__i18nReady。
   - 切换语言：await window.__setLang('zh'|'en')，随后页面自行重绘动态内容。
*/
(function () {
  var messages = {};
  var lang = 'zh';
  var ready = false;
  var readyResolve;
  var readyPromise = new Promise(function (resolve) { readyResolve = resolve; });

  function applyParams(text, params) {
    if (!params) return text;
    Object.keys(params).forEach(function (k) {
      text = String(text).split('{' + k + '}').join(String(params[k]));
    });
    return text;
  }

  window.__t = function (key, params) {
    var v = messages[key];
    if (v === undefined) v = key;
    return applyParams(v, params);
  };

  window.__lang = function () { return lang; };

  function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = window.__t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.placeholder = window.__t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.title = window.__t(el.getAttribute('data-i18n-title'));
    });
  }

  async function load(nextLang) {
    lang = (nextLang === 'en') ? 'en' : 'zh';
    try {
      if (window.api && window.api.getMessages) {
        messages = await window.api.getMessages(lang);
      } else {
        messages = {};
      }
    } catch (e) {
      messages = {};
    }
    document.documentElement.lang = (lang === 'zh') ? 'zh-CN' : 'en';
    applyStatic();
    if (!ready) { ready = true; readyResolve(); }
    return lang;
  }

  window.__i18nReady = readyPromise;
  window.__setLang = load;

  (function init() {
    if (window.api && window.api.getLanguage) {
      window.api.getLanguage().then(load).catch(function () { load('zh'); });
    } else {
      load('zh');
    }
  })();
})();

/* WorkspAIce landing — minimal interactions
   - Theme toggle (persists in localStorage, respects prefers-color-scheme)
   - Year stamp in footer
   - Live update of theme-color meta tags
*/
(function () {
  'use strict';

  var STORAGE_KEY = 'workspaice-theme';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function currentTheme() {
    return root.getAttribute('data-theme') || 'light';
  }

  function setTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    var btn = document.querySelector('.theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    updateMetaThemeColor(theme);
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* noop */ }
    }
  }

  function updateMetaThemeColor(theme) {
    var color = theme === 'dark' ? '#303841' : '#F5F5F5';
    var tags = document.querySelectorAll('meta[name="theme-color"]');
    tags.forEach(function (t) { t.setAttribute('content', color); });
  }

  function toggleTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next, true);
  }

  function initThemeButton() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', currentTheme() === 'dark' ? 'true' : 'false');
    btn.addEventListener('click', toggleTheme);
  }

  function initSystemThemeListener() {
    if (!mq) return;
    var handler = function (e) {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return; // user override wins
      } catch (err) { /* noop */ }
      setTheme(e.matches ? 'dark' : 'light', false);
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  function initYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function init() {
    initThemeButton();
    initSystemThemeListener();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

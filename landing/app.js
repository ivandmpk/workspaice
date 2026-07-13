/* WorkspAIce landing — minimal interactions
   - Theme toggle (persists in localStorage, respects prefers-color-scheme)
   - Year stamp in footer
   - Live update of theme-color meta tags
   - Scroll-reveal animations (IntersectionObserver, honors reduced motion)
   Theme pre-paint bootstrap lives in theme-init.js (loaded in <head>).
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

  /* Scroll-reveal: elements with [data-reveal] fade/rise in when they enter
     the viewport. Progressive enhancement — without JS (or with reduced
     motion) everything is simply visible. */
  function initReveals() {
    if (!('IntersectionObserver' in window)) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) {
      var delay = el.getAttribute('data-reveal');
      if (delay && delay !== '') {
        el.style.transitionDelay = (Number(delay) * 90) + 'ms';
      }
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  function init() {
    initThemeButton();
    initSystemThemeListener();
    initYear();
    initReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

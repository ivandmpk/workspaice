/* Applies the saved (or system) theme before first paint to avoid a flash.
   Loaded synchronously in <head> — keep this file tiny.
   External file (not inline) so the CSP can stay `script-src 'self'`. */
(function () {
  try {
    var saved = localStorage.getItem('workspaice-theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    // localStorage unavailable; keep the default light theme
  }
})();

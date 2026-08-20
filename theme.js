// Physics FM — переключатель светлой/тёмной темы
(function () {
  var KEY = 'pfm-theme';
  var root = document.documentElement;

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') || 'light';
      apply(current === 'dark' ? 'light' : 'dark');
    });
  });
})();

/* 把 Butterfly 右下角抽屉里的「日/夜」按钮，搬到导航栏最右侧 */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function isDark() {
    var de = document.documentElement;
    return (
      de.getAttribute('data-theme') === 'dark' ||
      document.body.classList.contains('dark')
    );
  }

  function paint() {
    var a = document.getElementById('nav-darkmode');
    if (!a) return;
    // 浅色模式显示太阳，深色模式显示月亮
    a.innerHTML = isDark()
      ? '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/></svg>';
  }

  function build() {
    if (document.getElementById('nav-darkmode')) return;
    var menus = document.getElementById('menus');
    if (!menus) return;

    var a = document.createElement('a');
    a.id = 'nav-darkmode';
    a.className = 'nav-darkmode';
    a.href = 'javascript:void(0)';
    a.title = '日间 / 夜间模式';
    a.setAttribute('aria-label', '日间或夜间模式切换');
    a.addEventListener('click', function () {
      var src = document.getElementById('darkmode');
      if (src) {
        src.click(); // 复用 Butterfly 自己的切换逻辑与本地存储
      }
      paint();
      setTimeout(paint, 60);
    });
    menus.appendChild(a);
    paint();

    // 自动模式或系统切换时也跟着同步图标
    new MutationObserver(paint).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
  }

  window.__ndInit = build;

  ready(build);
})();

/* 站内跳转不整页刷新：swup 4 只替换 #body-wrap
   播放器、侧栏、右侧悬浮按钮都在 #body-wrap 外面，所以换页时不会重启。
   导航条统一搬到 body 下（换页不会被替换，也不受 #page-header 层叠影响）。 */
(function () {
  if (!window.Swup) return

  function isHome() {
    var p = location.pathname
    return p === '/' || /\/index\.html$/.test(p)
  }

  /* 全站把 #nav 钉在 body 下：进来一份新的就扔掉旧的，保证只有一个 */
  function syncNav() {
    var fresh = document.querySelector('#body-wrap #nav')
    var kept = document.querySelector('body > #nav')
    if (fresh && kept) fresh.parentNode.removeChild(fresh)
    else if (fresh) document.body.appendChild(fresh)
  }

  /* 滚动时导航条收起/滑出 + 加磨砂底（全站统一） */
  var lastY = 0
  function onScroll() {
    var nav = document.querySelector('body > #nav')
    if (!nav) return
    var y = window.pageYOffset || document.documentElement.scrollTop
    var root = document.documentElement
    if (y < 40) {
      nav.classList.remove('nav-hide')
      root.classList.remove('se-scrolled')
    } else {
      root.classList.add('se-scrolled')
      if (y > lastY + 4) nav.classList.add('nav-hide')
      else if (y < lastY - 4) nav.classList.remove('nav-hide')
    }
    lastY = y
  }

  /* 换页后主题不会重跑页面里那段 giscus 脚本，这里手动补一次 */
  function loadGiscus() {
    var wrap = document.getElementById('giscus-wrap')
    if (!wrap) return
    if (wrap.querySelector('iframe') || wrap.querySelector('script')) return
    var dark = document.documentElement.getAttribute('data-theme') === 'dark'
    var s = document.createElement('script')
    s.src = 'https://giscus.app/client.js'
    s.setAttribute('data-repo', 'waxen233/waxen233.github.io')
    s.setAttribute('data-repo-id', 'R_kgDOV3Y-Lg')
    s.setAttribute('data-category-id', 'DIC_kwDOV3Y-Ls4DL30V')
    s.setAttribute('data-mapping', 'pathname')
    s.setAttribute('data-reactions-enabled', '1')
    s.setAttribute('data-emit-metadata', '0')
    s.setAttribute('data-input-position', 'top')
    s.setAttribute('data-theme', dark ? 'dark' : 'light')
    s.setAttribute('data-lang', 'zh-CN')
    s.crossOrigin = 'anonymous'
    s.async = true
    wrap.appendChild(s)
  }

  
  /* 顶部加载进度条：切页时跑一次 */
  var bar = null
  var barTimer = null
  function makeBar() {
    if (bar) return bar
    bar = document.createElement('div')
    bar.id = 'swup-progress'
    bar.setAttribute('aria-hidden', 'true')
    bar.innerHTML = '<i></i>'
    document.body.appendChild(bar)
    return bar
  }
  function barStart() {
    var el = makeBar()
    clearInterval(barTimer)
    el.classList.add('is-on')
    el.classList.remove('is-done')
    el.style.setProperty('--p', '0%')
    requestAnimationFrame(function () {
      el.style.setProperty('--p', '14%')
    })
    var v = 14
    barTimer = setInterval(function () {
      v += (92 - v) * 0.12
      el.style.setProperty('--p', v.toFixed(1) + '%')
    }, 180)
  }
  function barSettle() {
    var el = makeBar()
    clearInterval(barTimer)
    el.style.setProperty('--p', '92%')
  }
  function barDone() {
    var el = makeBar()
    clearInterval(barTimer)
    el.style.setProperty('--p', '100%')
    el.classList.add('is-done')
    setTimeout(function () {
      el.classList.remove('is-on')
      el.classList.remove('is-done')
      el.style.setProperty('--p', '0%')
    }, 260)
  }

  function reinit() {
    syncNav()

    var seen = false
    try { seen = sessionStorage.getItem('se-entered') === '1' } catch (e) {}

    if (isHome()) {
      if (!seen && !document.getElementById('se-frame') && !document.getElementById('se-plate')) {
        var plate = document.createElement('div')
        plate.id = 'se-plate'
        plate.setAttribute('aria-hidden', 'true')
        plate.innerHTML = '<img src="/img/hero-poster.jpg" alt="">'
        document.body.appendChild(plate)
      }
      document.documentElement.classList.toggle('se-locked', !seen)
    } else {
      document.documentElement.classList.remove('se-locked')
    }

    if (typeof window.__seReinit === 'function') window.__seReinit()
    if (typeof window.__smInit === 'function') window.__smInit()
    if (typeof window.__ctInit === 'function') window.__ctInit()
    if (typeof window.__ndInit === 'function') window.__ndInit()

    window.scrollTo(0, 0)
    lastY = 0
    onScroll()
    setTimeout(loadGiscus, 60)
    window.dispatchEvent(new Event('resize'))
  }

  function start() {
    syncNav()
    window.addEventListener('scroll', onScroll, { passive: true })

    var swup = new window.Swup({
      containers: ['#body-wrap'],
      animationSelector: '#body-wrap',
      cache: true,
      preload: true
    })
    window.__swup = swup
    swup.hooks.on('visit:start', barStart)
    swup.hooks.on('content:replace', barSettle)
    swup.hooks.on('content:replace', reinit)
    swup.hooks.on('page:view', function () {
      barDone()
      reinit()
    })
    onScroll()
  }



  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()

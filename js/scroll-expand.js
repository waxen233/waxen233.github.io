/* 首屏：视频 + 打字 + 点一下撑满全屏
   跑在 Butterfly 的 #page-header 上，只在首页生效。
   参数集中在 SE 里，改数字就能调手感。 */
(function () {
  var TITLE = '即使迷茫，也要继续前进' // 开头那句
  var TXT = '迷途之子' // 下面的小字（打字）
  var T0 = 0.3
  var DUR = 1.6
  var CYCLE = 7

  var SE = {
    startWidth: 42, // 起始宽度 %
    startHeight: 58, // 起始高度 %
    startRadius: 24, // 起始圆角 px
    endRadius: 0,
    mediaZoom: 1.35, // 起始时媒体放大倍数
    duration: 1400, // 撑满用多久（毫秒）
    scrim: 0.45
  }

  var clamp = function (v, a, b) {
    return v < a ? a : v > b ? b : v
  }
  var smoothstep = function (a, b, x) {
    var t = clamp((x - a) / (b - a || 1e-6), 0, 1)
    return t * t * (3 - 2 * t)
  }

  function boot() {
    if (location.pathname !== '/') return
    var header = document.getElementById('page-header')
    if (!header) return

    /* ---------- 1. 视频 ---------- */
    var video = document.getElementById('hero-video')
    if (!video) {
      video = document.createElement('video')
      video.id = 'hero-video'
      video.src = '/video/hero.mp4'
      video.poster = '/img/hero-poster.jpg'
      video.autoplay = true
      video.loop = true
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
      video.setAttribute('muted', '')
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
      video.addEventListener(
        'canplay',
        function () {
          video.classList.add('ready')
        },
        { once: true }
      )
    }

    /* ---------- 2. 结构 ---------- */
    if (!document.getElementById('se-frame')) {
      var frame = document.createElement('div')
      frame.id = 'se-frame'
      var scrim = document.createElement('div')
      scrim.id = 'se-scrim'
      frame.appendChild(video)
      frame.appendChild(scrim)
      header.insertBefore(frame, header.firstChild)

      var hint = document.createElement('div')
      hint.id = 'se-hint'
      hint.textContent = '点一下展开'
      header.appendChild(hint)
    }

    var frameEl = document.getElementById('se-frame')
    var scrimEl = document.getElementById('se-scrim')
    var hintEl = document.getElementById('se-hint')
    var siteInfo = document.getElementById('site-info')
    var siteTitle = document.getElementById('site-title')
    var sub = document.getElementById('subtitle')

    /* ---------- 3. 把标题换成那句话 ---------- */
    if (siteTitle) siteTitle.textContent = TITLE

    /* ---------- 4. 画一帧 ---------- */
    function apply(p) {
      var e = smoothstep(0, 1, p)
      var w = SE.startWidth + (100 - SE.startWidth) * e
      var h = SE.startHeight + (100 - SE.startHeight) * e
      var ix = Math.max(0, (100 - w) / 2)
      var iy = Math.max(0, (100 - h) / 2)
      var r = SE.startRadius + (SE.endRadius - SE.startRadius) * e

      frameEl.style.clipPath =
        'inset(' + iy + '% ' + ix + '% ' + iy + '% ' + ix + '% round ' + r + 'px)'
      video.style.transform = 'scale(' + (SE.mediaZoom + (1 - SE.mediaZoom) * e) + ')'
      if (scrimEl) scrimEl.style.opacity = SE.scrim * e

      if (siteInfo) {
        var out = smoothstep(0.25, 0.75, p)
        siteInfo.style.opacity = 1 - out
        siteInfo.style.transform = 'translate3d(0,' + -24 * out + 'px,0)'
      }
    }

    apply(0)

    /* ---------- 5. 点一下 → 慢慢撑满 ---------- */
    var expanded = false
    function expand() {
      if (expanded) return
      expanded = true
      frameEl.classList.add('se-expanded')
      if (hintEl) hintEl.classList.add('hide')

      var t0 = 0
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      var dur = reduce ? 1 : SE.duration

      function step(now) {
        if (!t0) t0 = now
        var p = clamp((now - t0) / dur, 0, 1)
        var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
        apply(e)
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }

    // 绑在 #page-header 上：标题、提示这些覆盖层是 frame 的兄弟节点，
    // 只绑 frame 的话点在字上触发不到。导航区除外。
    header.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('#nav')) return
      expand()
    })

    /* ---------- 6. 打字（跟视频时间轴走） ---------- */
    function typeTick() {
      if (sub && video) {
        var t = video.currentTime % CYCLE
        var n = Math.floor((t - T0) / (DUR / TXT.length)) + 1
        n = Math.max(0, Math.min(TXT.length, n))
        var s = TXT.slice(0, n)
        if (sub.textContent !== s) sub.textContent = s
      }
      requestAnimationFrame(typeTick)
    }
    typeTick()
  }

  if (document.readyState !== 'loading') boot()
  else document.addEventListener('DOMContentLoaded', boot)
})()

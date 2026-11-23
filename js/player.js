/* 站内音乐播放器（dock 形态）：默认一颗唱片，点开长成播放条 */
(function () {
  var API = 'https://api.injahow.cn/meting/'
  var SERVER = 'tencent'
  var PLAYLIST = '9812067108' /* 用户自己的 QQ 音乐歌单 */

  var ICON_VOL_ON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M19 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  var ICON_VOL_OFF = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'

  var ICON = {
    vol: ICON_VOL_ON,
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M7 5h2v14H7zM20 5v14l-11-7z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M17 5h2v14h-2zM4 5v14l11-7z"/></svg>'
  }

  var songs = []
  var index = 0
  var audio = null
  var root = null
  var open = false

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0
    var m = Math.floor(s / 60)
    var x = Math.floor(s % 60)
    return m + ':' + (x < 10 ? '0' : '') + x
  }

  function q(sel) { return root.querySelector(sel) }
  function qa(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)) }

  function paint() {
    if (!root) return
    var d = audio.duration || 0
    var p = d ? (audio.currentTime / d) * 100 : 0
    qa('.pl-bar-fill').forEach(function (n) { n.style.width = p.toFixed(2) + '%' })
    qa('[data-time]').forEach(function (n) { n.textContent = fmt(audio.currentTime) + ' / ' + fmt(d) })
  }

  function syncButton() {
    var playing = !audio.paused
    qa('[data-play]').forEach(function (n) { n.innerHTML = playing ? ICON.pause : ICON.play })
    if (playing) root.setAttribute('data-playing', '')
    else root.removeAttribute('data-playing')
  }

  function load(i, autoplay) {
    if (!songs.length) return
    index = (i + songs.length) % songs.length
    var s = songs[index]
    audio.src = s.url
    audio.load()
    qa('[data-title]').forEach(function (n) { n.textContent = s.name || '未知曲目' })
    qa('[data-artist]').forEach(function (n) { n.textContent = s.artist || '' })
    if (s.pic) root.style.setProperty('--dock-cover', 'url("' + s.pic + '")')
    if (autoplay) audio.play().catch(function () {})
  }

  function toggle() {
    if (!songs.length) return
    if (!audio.src) { load(index, true); return }
    if (audio.paused) audio.play().catch(function () {})
    else audio.pause()
  }

  function build() {
    root.innerHTML =
      '<div class="pl-dock-disc" data-disc></div>' +
      '<div class="pl-dock-body">' +
      '<div class="pl-meta">' +
      '<span class="pl-title" data-title>正在加载…</span>' +
      '<span class="pl-artist" data-artist></span>' +
      '<div class="pl-bar" style="margin-top:7px"><div class="pl-bar-fill"></div></div>' +
      '</div>' +
      '<button class="pl-btn" data-prev aria-label="上一首">' + ICON.prev + '</button>' +
      '<button class="pl-btn pl-play" data-play aria-label="播放 / 暂停">' + ICON.play + '</button>' +
      '<button class="pl-btn" data-next aria-label="下一首">' + ICON.next + '</button>' +
      '<button class="pl-btn pl-vol" data-mute aria-label="静音">' + ICON.vol + '</button>' +
      '<div class="pl-volume" data-vol role="slider" aria-label="音量"><div class="pl-vol-fill"></div><div class="pl-vol-thumb"></div></div>' +
      '</div>'

    q('[data-disc]').addEventListener('click', function (e) {
      e.stopPropagation()
      if (suppressClick) return
      open = !open
      root.toggleAttribute('data-open', open)
      toggle()
    })
    qa('[data-play]').forEach(function (n) {
      n.addEventListener('click', function (e) { e.stopPropagation(); toggle() })
    })
    q('[data-prev]').addEventListener('click', function (e) { e.stopPropagation(); load(index - 1, true) })
    q('[data-next]').addEventListener('click', function (e) { e.stopPropagation(); load(index + 1, true) })
    q('.pl-bar').addEventListener('click', function (e) {
      e.stopPropagation()
      var r = this.getBoundingClientRect()
      if (audio.duration) audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration
    })

    /* ---------- 音量：自绘滑块 + 拖到两端会像橡胶一样拉伸再弹回 ---------- */
    var VOL_KEY = 'player-vol2'
    var savedVol = parseFloat(localStorage.getItem(VOL_KEY))
    if (!(savedVol >= 0 && savedVol <= 1)) savedVol = 0.35
    var volEl = q('[data-vol]')
    var volFill = q('.pl-vol-fill')
    var volThumb = q('.pl-vol-thumb')
    var muteBtn = q('[data-mute]')
    var volDragging = false

    audio.volume = savedVol

    function paintVol() {
      var muted = audio.muted
      var v = muted ? 0 : audio.volume
      volFill.style.width = (v * 100).toFixed(2) + '%'
      volThumb.style.left = (v * 100).toFixed(2) + '%'
      muteBtn.innerHTML = (muted || v === 0) ? ICON_VOL_OFF : ICON_VOL_ON
    }

    function setVol(v, save) {
      v = Math.max(0, Math.min(1, v))
      audio.muted = false
      audio.volume = v
      if (save) localStorage.setItem(VOL_KEY, String(v))
      paintVol()
    }

    /* 拖动时允许视觉上越界拉伸（最多 12%），松手弹回 */
    function stretch(over) {
      var k = 1 + Math.min(0.12, Math.abs(over) * 0.35)
      volThumb.style.transform = 'translate(-50%, -50%) scale(' + k.toFixed(3) + ')'
      volEl.classList.toggle('is-over', Math.abs(over) > 0.001)
    }

    function volFromX(clientX) {
      var r = volEl.getBoundingClientRect()
      var raw = (clientX - r.left) / r.width
      stretch(raw < 0 ? raw : (raw > 1 ? raw - 1 : 0))
      return Math.max(0, Math.min(1, raw))
    }

    volEl.addEventListener('pointerdown', function (e) {
      e.stopPropagation()
      volDragging = true
      setVol(volFromX(e.clientX), true)
      window.addEventListener('pointermove', onVolMove)
      window.addEventListener('pointerup', onVolUp)
    })
    function onVolMove(e) {
      if (!volDragging) return
      setVol(volFromX(e.clientX), false)
    }
    function onVolUp() {
      volDragging = false
      localStorage.setItem(VOL_KEY, String(audio.volume))
      volEl.classList.remove('is-over')
      volThumb.style.transform = 'translate(-50%, -50%) scale(1)'
      window.removeEventListener('pointermove', onVolMove)
      window.removeEventListener('pointerup', onVolUp)
    }
    volEl.addEventListener('click', function (e) { e.stopPropagation() })

    muteBtn.addEventListener('click', function (e) {
      e.stopPropagation()
      audio.muted = !audio.muted
      paintVol()
    })
    paintVol()

    document.addEventListener('click', function (e) {
      if (!open) return
      if (!root.contains(e.target)) {
        open = false
        root.removeAttribute('data-open')
      }
    })
  }


  /* ---------- 拖动 ---------- */
  var POS_KEY = 'player-pos'
  var drag = null
  var suppressClick = false

  function clampPos(l, t) {
    var w = root.offsetWidth
    var h = root.offsetHeight
    var maxL = Math.max(0, window.innerWidth - w - 8)
    var maxT = Math.max(0, window.innerHeight - h - 8)
    return [Math.min(Math.max(8, l), maxL), Math.min(Math.max(8, t), maxT)]
  }

  function applyPos(l, t) {
    root.style.left = l + 'px'
    root.style.top = t + 'px'
    root.style.bottom = 'auto'
  }

  function savePos() {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({
        l: parseInt(root.style.left, 10) || 22,
        t: parseInt(root.style.top, 10) || 0
      }))
    } catch (e) {}
  }

  function restorePos() {
    var raw = null
    try { raw = localStorage.getItem(POS_KEY) } catch (e) {}
    if (!raw) return
    try {
      var p = JSON.parse(raw)
      var r = root.getBoundingClientRect()
      var l = p.l
      var t = p.t !== undefined ? p.t : r.top
      var c = clampPos(l, t)
      applyPos(c[0], c[1])
    } catch (e) {}
  }

  function makeDraggable() {
    root.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return
      if (e.target.closest('.pl-btn, .pl-bar, .pl-volume, .pl-vol')) return

      var r = root.getBoundingClientRect()
      drag = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, moved: false }
      suppressClick = false
      root.style.cursor = 'grabbing'
    })

    window.addEventListener('pointermove', function (e) {
      if (!drag) return
      var dx = e.clientX - drag.x
      var dy = e.clientY - drag.y
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true
      if (!drag.moved) return
      var c = clampPos(drag.l + dx, drag.t + dy)
      applyPos(c[0], c[1])
      suppressClick = true
    })

    window.addEventListener('pointerup', function () {
      if (!drag) return
      var wasMoved = drag.moved
      drag = null
      root.style.cursor = ''
      if (wasMoved) savePos()
      setTimeout(function () { suppressClick = false }, 0)
    })

    window.addEventListener('pointercancel', function () {
      drag = null
      root.style.cursor = ''
    })
  }

  function boot() {
    root = document.getElementById('site-player')
    if (!root) return

    audio = new Audio()
    audio.preload = 'none'
    audio.addEventListener('timeupdate', paint)
    audio.addEventListener('loadedmetadata', paint)
    audio.addEventListener('play', syncButton)
    audio.addEventListener('pause', syncButton)
    audio.addEventListener('ended', function () { load(index + 1, true) })

    build()
    restorePos()
    makeDraggable()

    /* 优先用本地清单（source/music/list.json），没有才退回 Meting 歌单 */
    fetch('/music/list.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('no-list')
        return r.json()
      })
      .then(function (list) {
        if (!list || !list.length) throw new Error('empty')
        songs = list
        load(0, false)
      })
      .catch(function () {
        return fetch(API + '?server=' + SERVER + '&type=playlist&id=' + PLAYLIST)
          .then(function (r) { return r.json() })
          .then(function (data) {
            songs = (data && data.data) || data || []
            if (!songs.length) throw new Error('empty')
            load(0, false)
          })
          .catch(function () {
            qa('[data-title]').forEach(function (n) { n.textContent = '暂无歌单' })
          })
      })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()

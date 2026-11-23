/* 站内音乐播放器（dock 形态）：默认一颗唱片，点开长成播放条 */
(function () {
  var API = 'https://api.injahow.cn/meting/'
  var SERVER = 'tencent'
  var PLAYLIST = '9762369050' /* TODO: 换成你自己的 QQ 音乐歌单 ID */

  var ICON = {
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
      if (e.target.closest('.pl-btn, .pl-bar')) return

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

    fetch(API + '?server=' + SERVER + '&type=playlist&id=' + PLAYLIST)
      .then(function (r) { return r.json() })
      .then(function (data) {
        songs = (data && data.data) || data || []
        if (!songs.length) throw new Error('empty')
        load(0, false)
      })
      .catch(function () {
        qa('[data-title]').forEach(function (n) { n.textContent = '歌单加载失败' })
      })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()

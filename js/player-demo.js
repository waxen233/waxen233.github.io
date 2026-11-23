/* 播放器对比：四种皮肤共用一套「取歌单 + 播放」逻辑 */
(function () {
  var API = 'https://api.injahow.cn/meting/'
  var SERVER = 'tencent'
  var PLAYLIST = '9762369050' /* 占位：别人的公开歌单，换成你自己的即可 */

  var ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M7 5h2v14H7zM20 5v14l-11-7z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M17 5h2v14h-2zM4 5v14l11-7z"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M12 3v10.6A3.4 3.4 0 1 0 14 17V7h4V3h-6z"/></svg>'
  }

  var songs = []
  var players = []
  var active = null

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0
    var m = Math.floor(s / 60)
    var x = Math.floor(s % 60)
    return m + ':' + (x < 10 ? '0' : '') + x
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag)
    if (cls) n.className = cls
    if (html != null) n.innerHTML = html
    return n
  }

  /* ---------- 一个播放器实例 ---------- */
  function Player(root) {
    var self = this
    this.root = root
    this.skin = root.getAttribute('data-skin')
    this.index = 0
    this.audio = new Audio()
    this.audio.preload = 'none'

    this.audio.addEventListener('timeupdate', function () { self.paint() })
    this.audio.addEventListener('loadedmetadata', function () { self.paint() })
    this.audio.addEventListener('ended', function () { self.next() })
    this.audio.addEventListener('play', function () {
      active = self
      players.forEach(function (p) { if (p !== self) p.audio.pause() })
      self.root.setAttribute('data-playing', '')
      self.syncButton()
    })
    this.audio.addEventListener('pause', function () {
      self.root.removeAttribute('data-playing')
      self.syncButton()
    })

    this.build()
  }

  Player.prototype.current = function () { return songs[this.index] || null }

  Player.prototype.load = function (i, autoplay) {
    if (!songs.length) return
    this.index = (i + songs.length) % songs.length
    var s = this.current()
    this.audio.src = s.url
    this.audio.load()
    this.paintMeta(s)
    if (autoplay) this.audio.play().catch(function () {})
  }

  Player.prototype.toggle = function () {
    if (!songs.length) return
    if (!this.audio.src) { this.load(this.index, true); return }
    if (this.audio.paused) this.audio.play().catch(function () {})
    else this.audio.pause()
  }

  Player.prototype.next = function () { this.load(this.index + 1, true) }
  Player.prototype.prev = function () { this.load(this.index - 1, true) }

  Player.prototype.paintMeta = function (s) {
    this.root.querySelectorAll('[data-title]').forEach(function (n) { n.textContent = s.name || '未知曲目' })
    this.root.querySelectorAll('[data-artist]').forEach(function (n) { n.textContent = s.artist || '' })
    this.root.querySelectorAll('[data-cover]').forEach(function (n) {
      if (n.tagName === 'IMG') n.src = s.pic || ''
    })
    if (s.pic) {
      this.root.style.setProperty('--disc-cover', 'url("' + s.pic + '")')
      this.root.style.setProperty('--dock-cover', 'url("' + s.pic + '")')
    }
  }

  Player.prototype.paint = function () {
    var d = this.audio.duration || 0
    var p = d ? (this.audio.currentTime / d) * 100 : 0
    this.root.querySelectorAll('.pl-bar-fill').forEach(function (n) { n.style.width = p.toFixed(2) + '%' })
    this.root.querySelectorAll('[data-time]').forEach(function (n) {
      n.textContent = fmt(this.audio.currentTime) + ' / ' + fmt(d)
    }, this)
  }

  Player.prototype.syncButton = function () {
    var playing = !this.audio.paused
    this.root.querySelectorAll('[data-play]').forEach(function (n) {
      n.innerHTML = playing ? ICON.pause : ICON.play
    })
  }

  Player.prototype.bindCommon = function (box) {
    var self = this
    box.querySelectorAll('[data-play]').forEach(function (n) {
      n.addEventListener('click', function (e) { e.stopPropagation(); self.toggle() })
    })
    box.querySelectorAll('[data-next]').forEach(function (n) {
      n.addEventListener('click', function (e) { e.stopPropagation(); self.next() })
    })
    box.querySelectorAll('[data-prev]').forEach(function (n) {
      n.addEventListener('click', function (e) { e.stopPropagation(); self.prev() })
    })
    box.querySelectorAll('.pl-bar').forEach(function (n) {
      n.addEventListener('click', function (e) {
        e.stopPropagation()
        var r = n.getBoundingClientRect()
        var d = self.audio.duration
        if (d) self.audio.currentTime = ((e.clientX - r.left) / r.width) * d
      })
    })
  }

  /* ---------- 四种皮肤 ---------- */
  Player.prototype.build = function () {
    var self = this
    var r = this.root

    if (this.skin === 'glass') {
      r.innerHTML =
        '<div class="pl-glass-head"><span data-title>正在加载…</span><span>≋</span></div>' +
        '<div class="pl-glass-body">' +
        '<div class="pl-row"><img class="pl-cover" data-cover alt=""><div class="pl-meta">' +
        '<span class="pl-title" data-title></span><span class="pl-artist" data-artist></span></div></div>' +
        '<div class="pl-bar"><div class="pl-bar-fill"></div></div>' +
        '<div class="pl-row" style="justify-content:space-between">' +
        '<span data-time style="font-size:11px;color:rgba(255,255,255,.6)">0:00 / 0:00</span>' +
        '<span style="display:flex;gap:4px">' +
        '<button class="pl-btn" data-prev>' + ICON.prev + '</button>' +
        '<button class="pl-btn pl-play" data-play>' + ICON.play + '</button>' +
        '<button class="pl-btn" data-next>' + ICON.next + '</button></span></div></div>'
      this.bindCommon(r)
      /* 拖拽 */
      var head = r.querySelector('.pl-glass-head')
      var drag = null
      head.addEventListener('pointerdown', function (e) {
        drag = { x: e.clientX, y: e.clientY }
        head.setPointerCapture(e.pointerId)
        r.style.position = 'relative'
      })
      head.addEventListener('pointermove', function (e) {
        if (!drag) return
        r.style.transform = 'translate(' + (e.clientX - drag.x) + 'px,' + (e.clientY - drag.y) + 'px)'
      })
      head.addEventListener('pointerup', function () { drag = null })
    }

    if (this.skin === 'edge') {
      r.innerHTML =
        '<div class="pl-edge-tab">' + ICON.note + '</div>' +
        '<div class="pl-edge-inner">' +
        '<img class="pl-cover" data-cover alt="">' +
        '<div class="pl-meta"><span class="pl-title" data-title></span>' +
        '<span class="pl-artist" data-artist></span></div>' +
        '<button class="pl-btn pl-play" data-play>' + ICON.play + '</button></div>'
      this.bindCommon(r)
      r.querySelector('.pl-edge-tab').addEventListener('click', function () {
        r.toggleAttribute('data-open')
      })
    }

    if (this.skin === 'vinyl') {
      r.innerHTML =
        '<div class="pl-disc-wrap">' +
        '<div class="pl-disc" data-play></div>' +
        '<svg class="pl-arm" viewBox="0 0 60 100" aria-hidden="true">' +
        '<circle cx="47" cy="12" r="9" fill="#3a3f47" stroke="rgba(255,255,255,.18)"/>' +
        '<rect x="44.5" y="12" width="5" height="66" rx="2.5" fill="#c9ced6"/>' +
        '<rect x="40" y="72" width="14" height="20" rx="4" fill="#e8ecf2"/></svg>' +
        '</div>' +
        '<span class="pl-title" data-title style="margin-top:6px"></span>' +
        '<span class="pl-artist" data-artist></span>' +
        '<div class="pl-bar" style="width:100%"><div class="pl-bar-fill"></div></div>' +
        '<div class="pl-row" style="justify-content:center;gap:10px">' +
        '<button class="pl-btn" data-prev>' + ICON.prev + '</button>' +
        '<button class="pl-btn pl-play" data-play>' + ICON.play + '</button>' +
        '<button class="pl-btn" data-next>' + ICON.next + '</button></div>'
      this.bindCommon(r)
    }

    if (this.skin === 'dock') {
      r.innerHTML =
        '<div class="pl-dock-disc" data-open-toggle></div>' +
        '<div class="pl-dock-body">' +
        '<div class="pl-meta"><span class="pl-title" data-title></span>' +
        '<span class="pl-artist" data-artist></span>' +
        '<div class="pl-bar" style="margin-top:7px"><div class="pl-bar-fill"></div></div></div>' +
        '<button class="pl-btn" data-prev>' + ICON.prev + '</button>' +
        '<button class="pl-btn pl-play" data-play>' + ICON.play + '</button>' +
        '<button class="pl-btn" data-next>' + ICON.next + '</button></div>'
      this.bindCommon(r)
      var toggle = r.querySelector('[data-open-toggle]')
      toggle.addEventListener('click', function () {
        r.toggleAttribute('data-open')
        self.toggle()
      })
    }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    var roots = document.querySelectorAll('[data-skin]')
    if (!roots.length) return
    players = Array.prototype.map.call(roots, function (n) { return new Player(n) })

    var url = API + '?server=' + SERVER + '&type=playlist&id=' + PLAYLIST
    fetch(url)
      .then(function (r) { return r.json() })
      .then(function (data) {
        songs = (data && data.data) || data || []
        if (!songs.length) throw new Error('empty')
        players.forEach(function (p) { p.load(0, false) })
      })
      .catch(function () {
        players.forEach(function (p) {
          p.root.querySelectorAll('[data-title]').forEach(function (n) { n.textContent = '歌单加载失败' })
        })
      })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()

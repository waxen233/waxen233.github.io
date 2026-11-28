/* 侧边栏：把「分类 / 标签 / 归档」三张卡合并成一张三行导航卡 */
(function () {
  function boot() {
    var aside = document.getElementById('aside-content')
    if (!aside) return

    var cards = {
      categories: aside.querySelector('.card-categories'),
      tags: aside.querySelector('.card-tags'),
      archives: aside.querySelector('.card-archives')
    }
    if (!cards.categories && !cards.tags && !cards.archives) return

    function countOf(card) {
      if (!card) return 0
      var n = card.querySelectorAll('a').length
      return n
    }

    var rows = [
      { key: 'categories', label: '分类', href: '/categories/', icon: 'fas fa-folder-open', n: countOf(cards.categories) },
      { key: 'tags', label: '标签', href: '/tags/', icon: 'fas fa-tags', n: countOf(cards.tags) },
      { key: 'archives', label: '归档', href: '/archives/', icon: 'fas fa-archive', n: countOf(cards.archives) }
    ].filter(function (r) {
      return r.n > 0
    })
    if (!rows.length) return

    var card = document.createElement('div')
    card.className = 'card-widget card-nav-merge'
    card.innerHTML =
      '<div class="item-headline"><i class="fas fa-compass"></i><span>博客</span></div>' +
      '<div class="nm-list"></div>'

    var list = card.querySelector('.nm-list')
    rows.forEach(function (r) {
      var a = document.createElement('a')
      a.className = 'nm-row'
      a.href = r.href
      a.innerHTML =
        '<i class="' + r.icon + ' nm-icon"></i>' +
        '<span class="nm-label">' + r.label + '</span>' +
        '<span class="nm-count">' + r.n + '</span>'
      list.appendChild(a)
    })

    var first = cards.categories || cards.tags || cards.archives
    first.parentNode.insertBefore(card, first)

    ;['categories', 'tags', 'archives'].forEach(function (k) {
      if (cards[k] && cards[k].parentNode) cards[k].parentNode.removeChild(cards[k])
    })
  }

  window.__smInit = boot

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()

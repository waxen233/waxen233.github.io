/* 首页卡片：把标签从"日期 | 分类 | 标签"那一行挪到卡片右下角 */
(function () {
  function init() {
    var cards = document.querySelectorAll('#recent-posts .recent-post-item')
    for (var i = 0; i < cards.length; i++) {
      var info = cards[i].querySelector('.recent-post-info')
      if (!info) continue
      var meta = info.querySelector('.article-meta.tags')
      if (!meta) continue
      var links = meta.querySelectorAll('a.article-meta__tags')
      if (!links.length) continue

      var box = info.querySelector('.card-tags-bottom')
      if (!box) {
        box = document.createElement('div')
        box.className = 'card-tags-bottom'
        info.appendChild(box)
      }
      for (var j = 0; j < links.length; j++) {
        var a = links[j]
        var name = a.textContent.trim()
        if (name.charAt(0) !== '#') a.textContent = '#' + name
        box.appendChild(a)
      }
      meta.parentNode.removeChild(meta)
    }
  }

  window.__ctInit = init

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()

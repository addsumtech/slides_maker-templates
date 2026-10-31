/* The template library at #languages. Data and media are exported from the main repository's style registry.
   The home page calls window.slideMakerLibrary.setLang(lang) when its language changes. */
(function () {
  'use strict';
  var BASE = '/languages/';           // library.json and its media stay where the exporter writes them
  var HASH = 'vl-';                   // #vl-<id> opens a language (a bare #<id> could be any section of the page)
  var FEATURED = ['editorial', 'poster', 'ink', 'circuit'];

  var T = {
    en: {
      searchLabel: 'Search templates',
      search: 'Search by name or topic', all: 'All', imageLed: 'With images', drawn: 'No images needed',
      headline: function (n) { return 'Choose from ' + n + ' templates'; },
      langLabel: 'Switch the page to Chinese',
      lede: 'Every template includes two palettes and seven page types, with matching typography and charts. ' +
        'Preview the pages, choose a palette, then copy the prompt and give slide-maker your material.',
      count: function (n, t) { return n === t ? t + ' templates' : n + ' of ' + t; },
      empty: function (q) { return q ? 'No template matches “' + q + '”.' : 'No template of this kind yet.'; },
      clear: 'Clear filters', copyPrompt: 'Copy prompt', details: 'See all pages', copied: 'Copied',
      copyFailed: 'Copy failed — open the template and select the text',
      pagesH: 'Seven page types', pagesNote: 'These previews use the same text across templates, so you can compare their layouts.',
      notRendered: 'The page renders for this ground are not exported yet; the sample sheets below show the look.',
      sheetsH: 'Sample pages in both palettes', sheetsNote: 'See how this template looks with content suited to its style.',
      useH: 'How to use it', prompt: 'Give slide-maker this prompt and your material', ground: 'Palette', close: 'Close',
      enlarge: 'Enlarge', original: 'Open original image', loadFail: 'The library could not be loaded.'
    },
    zh: {
      searchLabel: '搜索模板',
      search: '搜索模板名称或主题', all: '全部', imageLed: '搭配图片', drawn: '无需配图',
      headline: function (n) { return n + ' 套模板，选一套开始'; },
      langLabel: '切换为英文页面',
      lede: '每套都有两种配色、七类页面，以及配套的字体和图表。点开样张看完整页面，选好配色，复制提示词，再带上自己的材料交给 slide-maker。',
      count: function (n, t) { return n === t ? '共 ' + t + ' 套' : n + ' / ' + t + ' 套'; },
      empty: function (q) { return q ? '没有匹配“' + q + '”的模板。' : '这一类暂时还没有。'; },
      clear: '清除筛选', copyPrompt: '复制提示词', details: '看全部页面', copied: '已复制',
      copyFailed: '复制失败，请打开这套模板手动选中文字',
      pagesH: '七种页面', pagesNote: '每套模板使用同一份演示文字，方便在相同内容上比较画风。',
      notRendered: '这种底色的页面渲染还没有导出；下方的样张展示了它的外观。',
      sheetsH: '两种配色的样张', sheetsNote: '结合适合这套画风的题材，看看实际排版效果。',
      useH: '怎么用', prompt: '把这句话和你的材料一起交给 slide-maker', ground: '配色', close: '关闭',
      enlarge: '放大查看', original: '查看原图', loadFail: '模板库加载失败。'
    }
  };

  var state = { lang: 'en', q: '', kind: 'all', ground: {}, lib: null, opener: null, zoomOpener: null, pushed: false };
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (e) { n.addEventListener(e, v[e]); });
      else if (k === 'style') n.setAttribute('style', v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function t(key) { return T[state.lang][key]; }
  function L(obj) { return obj ? (obj[state.lang] || obj.en || '') : ''; }
  function templatePrompt(g) { return L(g.prompt).replace(/visual language/g, 'template').replace(/视觉语言/g, '模板'); }
  function hex(h) { return '#' + String(h || '').replace(/^#/, ''); }
  function asset(p) { return /^(?:[a-z]+:|\/)/i.test(p || '') ? p : BASE + p; }   // library.json paths are relative to it

  function pickLang() { return /^zh\b/i.test(document.documentElement.lang || '') ? 'zh' : 'en'; }   // the home page's

  function groundOf(x) {
    var id = state.ground[x.id];
    for (var i = 0; i < x.grounds.length; i++) if (x.grounds[i].id === id) return x.grounds[i];
    return x.grounds[0];
  }

  function copy(text, btn) {
    var old = btn.textContent, settled = false;
    function report(ok) {               // drawn on the button AND announced; never "Copied" for a copy that failed
      var live = $('vlLive'), msg = ok ? t('copied') : t('copyFailed');
      btn.textContent = ok ? t('copied') : '✕';
      if (live) live.textContent = ok ? msg + ': ' + text : msg;
      setTimeout(function () { btn.textContent = old; }, ok ? 1400 : 2600);
    }
    function fallback() {
      var ta = el('textarea', { style: 'position:fixed;opacity:0;top:0;left:0' }), ok = false;
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand('copy') === true; } catch (e) { ok = false; }
      ta.remove();
      report(ok);
    }
    function once(fn) { return function () { if (!settled) { settled = true; fn(); } }; }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(once(function () { report(true); }), once(fallback));
      setTimeout(once(fallback), 1000);   // a write that never settles (a permission prompt nobody answers) still ends
    } else fallback();
  }

  /* ---------- url state ---------- */
  function readUrl() {
    var p = new URLSearchParams(location.search);
    state.q = (p.get('q') || '').slice(0, 80);
    var k = p.get('kind');
    state.kind = (k === 'image-led' || k === 'drawn') ? k : 'all';
  }
  function writeUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.kind !== 'all') p.set('kind', state.kind);
    var s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }

  /* ---------- static text ---------- */
  function paintChrome() {
    var lib = state.lib;
    document.querySelectorAll('#languages [data-vl-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-vl-i18n')); });
    $('vlQ').placeholder = t('search');
    $('vlClose').setAttribute('aria-label', t('close'));
    $('vlZoomClose').setAttribute('aria-label', t('close'));
    $('vlOriginal').textContent = t('original');
    if (!lib) return;
    $('vlHeadline').textContent = t('headline')(lib.stats.languages);
    $('vlLede').textContent = t('lede');
    var kinds = $('vlKinds');
    kinds.innerHTML = '';
    [['all', t('all')], ['image-led', t('imageLed')], ['drawn', t('drawn')]].forEach(function (k) {
      kinds.appendChild(el('button', { type: 'button', 'aria-pressed': String(state.kind === k[0]), 'data-kind': k[0],
        text: k[1], on: { click: function () { state.kind = k[0]; writeUrl(); paintChrome(); paintGrid(); } } }));
    });
  }

  /* ---------- the grid ---------- */
  function matches(x) {
    if (state.kind !== 'all' && x.kind !== state.kind) return false;
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    // both languages' words: a tag clicked in 中文 must still find its languages after switching to EN
    var hay = [x.id, x.name.en, x.name.zh, x.blurb.en, x.blurb.zh, (x.best_for.en || []).join(' '),
      (x.best_for.zh || []).join(' ')].join(' ').toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }

  function card(x) {
    var g = groundOf(x);
    var img = el('img', { src: asset(g.sample), alt: L(x.name) + ' — ' + L(g.label), loading: 'lazy', decoding: 'async',
      width: '1400', height: '800' });
    var sheet = el('button', { 'class': 'vl-sheet', type: 'button', 'aria-label': t('details') + ': ' + L(x.name),
      on: { click: function () { openDetail(x.id, sheet); } } }, [img]);
    var kids = [sheet];
    kids.push(el('div', { 'class': 'vl-crow' }, [x.grounds.length > 1 ?
      el('div', { 'class': 'vl-grounds', role: 'group', 'aria-label': t('ground') }, x.grounds.map(function (gg) {
        return el('button', { type: 'button', 'aria-pressed': String(gg.id === g.id), 'data-ground': gg.id,
          on: { click: function () { state.ground[x.id] = gg.id; paintGrid(); focusGround(x.id, gg.id); } } },
          [el('i', { style: 'background:' + hex(gg.swatches.ground) }), L(gg.label)]);
      })) : null]));
    var name = el('h3', null, [el('button', { type: 'button', text: L(x.name),
      on: { click: function (e) { openDetail(x.id, e.currentTarget); } } })]);
    kids.push(el('div', { 'class': 'vl-cbody' }, [
      el('div', { 'class': 'vl-cname' }, [name]),
      el('div', { 'class': 'vl-tags' }, (x.best_for[state.lang] || []).map(function (tag) {
        return el('button', { type: 'button', text: tag, on: { click: function () { setQuery(tag); } } });
      })),
      el('div', { 'class': 'vl-cfoot' }, [
        el('button', { 'class': 'btn primary', type: 'button', text: t('copyPrompt'),
          on: { click: function (e) { copy(templatePrompt(g), e.currentTarget); } } }),
        el('button', { 'class': 'btn ghost', type: 'button', text: t('details'),
          on: { click: function (e) { openDetail(x.id, e.currentTarget); } } })
      ])
    ]));
    return el('article', { 'class': 'vl-card', id: 'card-' + x.id, 'data-id': x.id }, kids);
  }

  function focusGround(id, gid) {
    var b = document.querySelector('#card-' + id + ' .vl-grounds button[data-ground="' + gid + '"]');
    if (b) b.focus();
  }

  function paintGrid() {
    var lib = state.lib, grid = $('vlGrid');
    grid.innerHTML = '';
    var shown = lib.languages.filter(matches);
    shown.sort(function (a, b) {
      var ai = FEATURED.indexOf(a.id), bi = FEATURED.indexOf(b.id);
      return (ai < 0 ? FEATURED.length : ai) - (bi < 0 ? FEATURED.length : bi);
    });
    shown.forEach(function (x) { grid.appendChild(card(x)); });
    $('vlCount').textContent = t('count')(shown.length, lib.languages.length);
    $('vlEmpty').hidden = shown.length > 0;
    $('vlEmptyText').textContent = t('empty')(state.q.trim());
    if ($('vlQ').value !== state.q) $('vlQ').value = state.q;
  }

  function setQuery(q) {
    state.q = q;
    writeUrl();
    paintGrid();
    $('vlQ').focus();
    window.scrollTo({ top: $('vlQ').getBoundingClientRect().top + window.scrollY - 80,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  /* ---------- the detail dialog ---------- */
  function find(id) {
    var ls = state.lib ? state.lib.languages : [];
    for (var i = 0; i < ls.length; i++) if (ls[i].id === id) return ls[i];
    return null;
  }

  function openDetail(id, opener) {
    state.opener = opener || null;
    if (location.hash !== '#' + HASH + id) {
      history.pushState(null, '', location.pathname + location.search + '#' + HASH + id);
      state.pushed = true;        // closing pops this entry, so Back never reopens the dialog
    }
    showDetail();
  }

  function copyRow(text) {
    return el('div', { 'class': 'vl-copyrow' }, [el('span', { text: text }),
      el('button', { 'class': 'btn ghost', type: 'button', text: t('copyPrompt').replace(/ prompt|提示词/, ''),
        on: { click: function (e) { copy(text, e.currentTarget); } } })]);
  }

  function preview(src, label, width, height) {
    var button = el('button', { 'class': 'vl-preview', type: 'button', 'aria-label': t('enlarge') + ': ' + label,
      on: { click: function () { openZoom(src, label, button); } } }, [
      el('img', { src: src, alt: label, loading: 'lazy', decoding: 'async', width: width, height: height })
    ]);
    return button;
  }

  function openZoom(src, label, opener) {
    state.zoomOpener = opener;
    $('vlZoomTitle').textContent = label;
    $('vlZoomImage').src = src;
    $('vlZoomImage').alt = label;
    $('vlOriginal').href = src;
    $('vlZoom').showModal();
    $('vlZoomClose').focus();
  }

  function closeZoom() {
    if ($('vlZoom').open) {
      $('vlZoom').close();
      restoreZoomFocus();
    }
  }

  function restoreZoomFocus() {
    var opener = state.zoomOpener;
    state.zoomOpener = null;
    if (opener && document.contains(opener) && $('vlDetail').open) opener.focus();
  }

  function renderDetail(x) {
    var g = groundOf(x);
    $('vlDTitle').textContent = L(x.name);
    var body = $('vlDBody');
    body.innerHTML = '';
    body.appendChild(el('p', { 'class': 'vl-blurb', text: L(x.blurb) }));
    if (x.grounds.length > 1) {
      body.appendChild(el('div', { 'class': 'vl-grounds', role: 'group', 'aria-label': t('ground'), style: 'padding:12px 0 0' },
        x.grounds.map(function (gg) {
          return el('button', { type: 'button', 'aria-pressed': String(gg.id === g.id), 'data-ground': gg.id,
            on: { click: function () { state.ground[x.id] = gg.id; renderDetail(x); paintGrid();
              var b = document.querySelector('#vlDBody .vl-grounds button[data-ground="' + gg.id + '"]'); if (b) b.focus(); } } },
            [el('i', { style: 'background:' + hex(gg.swatches.ground) }), L(gg.label)]);
        })));
    }
    body.appendChild(el('h4', { text: t('pagesH') }));
    var pts = state.lib.page_types || [];
    var have = pts.filter(function (p) { return g.pages && g.pages[p.id]; });
    if (have.length) {
      body.appendChild(el('div', { 'class': 'vl-pages' }, have.map(function (p) {
        return el('figure', null, [preview(asset(g.pages[p.id]), L(x.name) + ' ' + L(p.name) + ' ' + L(g.label), '960', '540'),
          el('figcaption', { text: L(p.name) })]);
      })));
      body.appendChild(el('p', { 'class': 'vl-note', text: t('pagesNote') }));
    } else body.appendChild(el('p', { 'class': 'vl-note', text: t('notRendered') }));
    body.appendChild(el('h4', { text: t('sheetsH') }));
    body.appendChild(el('div', { 'class': 'vl-sheets' }, x.grounds.map(function (gg) {
      return el('figure', null, [preview(asset(gg.sample), L(x.name) + ' ' + L(gg.label), '1400', '800'),
        el('figcaption', { text: L(gg.label) })]);
    })));
    body.appendChild(el('p', { 'class': 'vl-note', text: t('sheetsNote') }));
    body.appendChild(el('h4', { text: t('useH') }));
    body.appendChild(el('p', { 'class': 'vl-note', text: t('prompt'), style: 'margin:0 0 6px' }));
    body.appendChild(copyRow(templatePrompt(g)));
  }

  function showDetail() {
    closeZoom();
    var d = $('vlDetail');
    var raw = location.hash.replace(/^#/, ''), id = '';
    if (raw.indexOf(HASH) === 0) {
      try { id = decodeURIComponent(raw.slice(HASH.length)); } catch (e) { id = ''; }   // a malformed escape names nothing
    }
    var x = id ? find(id) : null;
    if (!x) { state.pushed = false; if (d.open) d.close(); return; }
    renderDetail(x);
    d.setAttribute('data-last', x.id);
    if (!d.open) {
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    }
    d.scrollTop = 0;
    $('vlClose').focus();
  }

  function closeDetail() {
    closeZoom();
    var d = $('vlDetail');
    if (state.pushed && location.hash) {   // we added the #vl-id entry: step back over it (popstate closes the dialog)
      state.pushed = false;
      history.back();
      return;
    }
    state.pushed = false;                   // a deep link: drop the hash without adding an entry
    if (location.hash) history.replaceState(null, '', location.pathname + location.search + '#languages');
    if (d.open) d.close();
  }

  /* ---------- wiring ---------- */
  function wire() {
    var timer = null;
    $('vlQ').addEventListener('input', function (e) {
      clearTimeout(timer);
      var v = e.target.value.slice(0, 80);
      timer = setTimeout(function () { state.q = v; writeUrl(); paintGrid(); }, 120);
    });
    $('vlClear').addEventListener('click', function () { state.q = ''; state.kind = 'all'; writeUrl(); paintChrome(); paintGrid(); });
    $('vlClose').addEventListener('click', closeDetail);
    $('vlZoomClose').addEventListener('click', closeZoom);
    var zoom = $('vlZoom');
    zoom.addEventListener('cancel', function (e) { e.preventDefault(); closeZoom(); });
    zoom.addEventListener('click', function (e) { if (e.target === zoom) closeZoom(); });
    zoom.addEventListener('close', restoreZoomFocus);
    var d = $('vlDetail');
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeDetail(); });
    d.addEventListener('click', function (e) { if (e.target === d) closeDetail(); });   // the backdrop
    d.addEventListener('close', function () {
      var o = state.opener;
      state.opener = null;
      if (o && document.contains(o)) o.focus();
      else {
        var id = d.getAttribute('data-last');
        var c = id && document.querySelector('#card-' + id + ' .vl-sheet');
        if (c) c.focus();
      }
    });
    window.addEventListener('hashchange', showDetail);
    window.addEventListener('popstate', function () { readUrl(); paintChrome(); paintGrid(); showDetail(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== $('vlQ') && !$('vlDetail').open) { e.preventDefault(); $('vlQ').focus(); }
    });
  }

  window.slideMakerLibrary = {
    setLang: function (lang) {
      state.lang = lang === 'zh' ? 'zh' : 'en';
      paintChrome();
      if (state.lib) { paintGrid(); if ($('vlDetail').open) showDetail(); }
    }
  };
  state.lang = pickLang();
  readUrl();
  wire();
  paintChrome();
  fetch(BASE + 'library.json', { cache: 'no-cache' }).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function (lib) {
    if (!lib || lib.schema !== 1 || !Array.isArray(lib.languages)) throw new Error('unknown library.json schema');
    lib.languages = lib.languages.filter(function (x) { return x && x.id && x.grounds && x.grounds.length; });
    state.lib = lib;
    paintChrome();
    paintGrid();
    showDetail();
  }).catch(function (err) {
    $('vlGrid').appendChild(el('p', { 'class': 'vl-status', text: t('loadFail') + ' (' + err.message + ')' }));
  });
})();

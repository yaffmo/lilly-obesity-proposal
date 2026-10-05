/* TMASO 衛教頁｜簡易互動版
   由 A 版完整動態的 main.js 精簡而來：不固定畫面、不做慣性擠壓與彈簧動態，
   只保留點擊與滑過的互動（Step 1／Step 2 用箭頭切換、BMI 計算機可實際計算）。 */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mq = window.matchMedia('(max-width: 1023px)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var absTop = function (el) { return el.getBoundingClientRect().top + window.scrollY; };
  var hdH = function () { return mq.matches ? 60 : 72; };

  function scrollToY(top) {
    window.scrollTo({ top: Math.max(0, top), behavior: reduce.matches ? 'auto' : 'smooth' });
  }

  /* ── Header 變霧面白；「尋找專業協助」在紅色區反白 ── */
  var hd = $('.hd'), fab = $('.fab'), s2sec = $('#step2'), dzSec = $('#dzsec');
  var geo = { redA: 0, redB: 0, fabC: 0 };
  function measureTone() {
    geo.redA = absTop(s2sec);
    geo.redB = absTop(dzSec) + dzSec.offsetHeight - 48;
    var fr = fab.getBoundingClientRect();
    geo.fabC = fr.top + fr.height / 2;
  }
  function onScroll() {
    var y = window.scrollY, fy = y + geo.fabC;
    hd.classList.toggle('is-solid', y > 40);
    doc.dataset.tone = fy > geo.redA && fy < geo.redB ? 'red' : 'light';
  }

  /* ── 3 步驟、指標卡：滑過（桌機）或捲到畫面中央（手機）就展開 ── */
  function group(items) {
    var set = function (el) { items.forEach(function (x) { x.classList.toggle('is-on', x === el); }); };
    items.forEach(function (el) {
      el.addEventListener('mouseenter', function () { if (!mq.matches) set(el); });
      el.addEventListener('focusin', function () { set(el); });
    });
    var io = new IntersectionObserver(function (es) {
      if (!mq.matches) return;
      es.forEach(function (e) { if (e.isIntersecting) set(e.target); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    items.forEach(function (el) { io.observe(el); });
    mq.addEventListener && mq.addEventListener('change', function () { set(items[0]); });
  }
  group($$('#stepsBox .st'));
  group($$('#s3cards .ind'));

  /* ── Step 1：箭頭一次推進一張，進度條跟著走 ── */
  var track = $('#track'), rail = $('#rail'), tprog = $('#tprog'), cards1 = $$('.c1');
  var prev1 = $('#prev'), next1 = $('#next');
  function alignRail() {
    var wrapL = Math.round($('.s1 .wrap').getBoundingClientRect().left);
    rail.style.paddingLeft = rail.style.paddingRight = wrapL + 'px';
  }
  function syncS1() {
    var max = track.scrollWidth - track.clientWidth, x = track.scrollLeft;
    tprog.style.setProperty('--tp', max > 0 ? (0.25 + 0.75 * x / max).toFixed(3) : 1);
    prev1.disabled = x <= 2;
    next1.disabled = x >= max - 2;
  }
  // 連點時從上一次的目標往下推，不從還在滑動中的位置算（否則連點兩下只會前進一張）
  var t1 = 0, t1At = 0;
  function go1(dir) {
    var step = cards1[0].offsetWidth + 16, max = track.scrollWidth - track.clientWidth;
    var base = performance.now() - t1At < 600 ? t1 : Math.round(track.scrollLeft / step) * step;
    t1 = clamp(base + dir * step, 0, max);
    t1At = performance.now();
    track.scrollTo({ left: t1, behavior: reduce.matches ? 'auto' : 'smooth' });
  }
  prev1.addEventListener('click', function () { go1(-1); });
  next1.addEventListener('click', function () { go1(1); });
  track.addEventListener('scroll', syncS1, { passive: true });

  /* ── Step 2：點擊切換 6 則警訊，照片跟著換 ── */
  var s2items = $$('.s2-item'), s2phs = $$('.s2-ph'), s2fill = $('#s2fill');
  var prev2 = $('#s2prev'), next2 = $('#s2next'), s2i = 0;
  function show2(idx) {
    s2i = clamp(idx, 0, s2items.length - 1);
    s2items.forEach(function (el, i) {
      el.classList.toggle('is-on', i === s2i);
      el.classList.toggle('is-past', i < s2i);
      el.setAttribute('aria-hidden', String(i !== s2i));
    });
    s2phs.forEach(function (el, i) { el.classList.toggle('is-on', i === s2i); el.classList.toggle('is-past', i < s2i); });
    s2fill.style.setProperty('--sp', ((s2i + 1) / s2items.length).toFixed(4));
    prev2.disabled = s2i === 0;
    next2.disabled = s2i === s2items.length - 1;
  }
  prev2.addEventListener('click', function () { show2(s2i - 1); });
  next2.addEventListener('click', function () { show2(s2i + 1); });
  // 點進度條直接跳到對應那則
  $('#s2prog').addEventListener('click', function (e) {
    var r = this.getBoundingClientRect();
    show2(Math.floor(clamp((e.clientX - r.left) / r.width, 0, 0.9999) * s2items.length));
  });
  show2(0);

  /* ── 頓悟區彈力帶：直接畫成放開後垂到字下方的樣子（Figma 2015:595） ──
     顏色照 KV/band.svg：8 個色標橫跨帶子寬度；沿曲線的法線方向切成多條細帶，彎曲時漸層也跟著轉。 */
  var aha = $('#aha'), ahaStage = $('#ahaStage'), ahaBandG = $('#ahaBandG');
  var BAND = [[0, [254, 247, 73]], [.11, [252, 223, 85]], [.3, [254, 228, 4]], [.39, [255, 250, 84]], [.5, [253, 225, 0]], [.65, [251, 241, 5]], [.78, [253, 255, 92]], [1, [246, 232, 24]]];
  function bandColor(t) {
    for (var i = 1; i < BAND.length; i++) {
      if (t <= BAND[i][0]) {
        var a = BAND[i - 1], b = BAND[i], k = (t - a[0]) / (b[0] - a[0]);
        return 'rgb(' + [0, 1, 2].map(function (n) { return Math.round(a[1][n] + (b[1][n] - a[1][n]) * k); }).join(',') + ')';
      }
    }
    return 'rgb(246,232,24)';
  }
  var STRIPES = 18, stripes = [];
  for (var sk = 0; sk < STRIPES; sk++) {
    var sp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    sp.setAttribute('stroke', bandColor((sk + 0.5) / STRIPES));
    ahaBandG.appendChild(sp);
    stripes.push(sp);
  }
  function drawBand() {
    var sr = ahaStage.getBoundingClientRect(), ar = aha.getBoundingClientRect();
    var x0 = Math.round(ar.left - sr.left - 24), x3 = Math.round(ar.right - sr.left + 24), W = x3 - x0;
    // 三次貝茲曲線最低點 = 0.75 × S：垂到字的下緣再往下 70（手機 56）
    var y0 = Math.round(sr.height * 0.5), S = (sr.height + (mq.matches ? 56 : 70) - y0) / 0.75, cy = y0 + S;
    var x1 = x0 + W * 0.22, x2 = x0 + W * 0.78, N = 56, pts = [], nrm = [];
    for (var i = 0; i <= N; i++) {
      var t = i / N, u = 1 - t;
      var x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
      var y = u * u * u * y0 + 3 * u * u * t * cy + 3 * u * t * t * cy + t * t * t * y0;
      var dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2);
      var dy = 3 * u * u * (cy - y0) + 3 * t * t * (y0 - cy);
      var l = Math.sqrt(dx * dx + dy * dy) || 1;
      pts.push(x, y); nrm.push(-dy / l, dx / l);
    }
    var bw = mq.matches ? 17 : 30, sw = (bw / STRIPES + 0.9).toFixed(2);
    for (var k = 0; k < STRIPES; k++) {
      var d = (-0.5 + (k + 0.5) / STRIPES) * bw, str = 'M';
      for (var q = 0; q <= N; q++) str += (pts[2 * q] + d * nrm[2 * q]).toFixed(1) + ' ' + (pts[2 * q + 1] + d * nrm[2 * q + 1]).toFixed(1) + (q < N ? 'L' : '');
      stripes[k].setAttribute('d', str);
      stripes[k].setAttribute('stroke-width', sw);
    }
  }

  /* ── 待提供的連結、影片、下載 ── */
  var toast = $('#toast'), toastT;
  var TODO = {
    clinic: '「尋找專業協助」的醫療院所連結待提供（預覽版）',
    video: 'OTV 影片檔待提供，目前先放封面（預覽版）',
    download: '下載的檔案格式待確認（預覽版）',
    link: '此連結待提供（預覽版）'
  };
  function say(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.hidden = true; }, 3200);
  }
  $$('[data-todo]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); say(TODO[el.dataset.todo]); });
  });

  /* ── BMI 計算機 ── */
  var CAT = ['過輕', '健康體重', '過重', '肥胖'];
  var RANGE = ['BMI < 18.5', '18.5 ≤ BMI < 24', '24 ≤ BMI < 27', 'BMI ≥ 27'];
  var COND = $$('#chips .chip span').map(function (s) { return s.textContent; });
  var st = { reached: 1, bmi: 0 };
  var panels = $$('#acc .panel');
  function show(n, focus) {
    if (n > st.reached) return;
    panels.forEach(function (p) {
      var k = Number(p.dataset.panel), bar = $('.bar', p), r = $('.bar-r', p);
      p.classList.toggle('is-open', k === n);
      p.classList.toggle('is-done', k !== n && k <= st.reached);
      p.classList.toggle('is-locked', k > st.reached);
      bar.disabled = k > st.reached;
      bar.setAttribute('aria-expanded', String(k === n));
      r.textContent = k === n ? '' : k <= st.reached ? '修改' : '完成上一步後開啟';
    });
    if (n === 3) renderResult();
    measureTone();
    var open = panels[n - 1], top = open.getBoundingClientRect().top;
    if (top < hdH() + 10 || top > window.innerHeight * 0.6) scrollToY(window.scrollY + top - hdH() - 24);
    if (focus) { var f = $('input, button:not(.bar)', open); if (f) f.focus({ preventScroll: true }); }
  }
  $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { show(Number(b.dataset.go), true); }); });

  var hIn = $('#bmi-h'), wIn = $('#bmi-w'), err = $('#err');
  [hIn, wIn].forEach(function (inp) {
    inp.addEventListener('input', function () {
      var v = inp.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
      if (v !== inp.value) inp.value = v;
      inp.closest('.field').classList.remove('has-err');
    });
  });
  $('#card1').addEventListener('submit', function (e) {
    e.preventDefault();
    var h = parseFloat(hIn.value), w = parseFloat(wIn.value);
    var badH = !(h >= 100 && h <= 250), badW = !(w >= 20 && w <= 300);
    hIn.closest('.field').classList.toggle('has-err', badH);
    wIn.closest('.field').classList.toggle('has-err', badW);
    if (badH || badW) {
      err.textContent = '請輸入身高 100–250 公分、體重 20–300 公斤。';
      err.hidden = false;
      (badH ? hIn : wIn).focus();
      return;
    }
    err.hidden = true;
    st.bmi = w / Math.pow(h / 100, 2);
    st.reached = Math.max(st.reached, 2);
    show(2, true);
  });

  var chips = $$('#chips input'), none = $('#none');
  $('#chips').addEventListener('change', function (e) {
    if (e.target === none && none.checked) chips.forEach(function (i) { if (i !== none) i.checked = false; });
    else if (e.target !== none && e.target.checked) none.checked = false;
    chips.forEach(function (i) { i.closest('.chip').classList.toggle('is-checked', i.checked); });
  });
  $('#toResult').addEventListener('click', function () { st.reached = 3; show(3, false); });

  function countUp(el, to, dec, ms) {
    if (reduce.matches) { el.textContent = to.toFixed(dec); return; }
    var t0 = performance.now();
    (function step(now) {
      var k = clamp((now - t0) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (to * e).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  function renderResult() {
    var b = Math.round(st.bmi * 10) / 10, band = b < 18.5 ? 0 : b < 24 ? 1 : b < 27 ? 2 : 3;
    $('#rCat').textContent = CAT[band];
    $('#rSent').textContent = '您的 BMI 為 ' + b.toFixed(1) + '，落在「' + CAT[band] + '」範圍（' + RANGE[band] + '）。';
    $$('#segs i').forEach(function (s, i) { s.classList.toggle('on', i === band); });
    var mk = $('#mk');
    mk.style.transition = 'none'; mk.style.left = '0%'; void mk.offsetWidth; mk.style.transition = '';
    requestAnimationFrame(function () { mk.style.left = (clamp((b - 15) / 20, 0, 1) * 100).toFixed(2) + '%'; });
    countUp($('#rBmi'), b, 1, 1100);
    var list = $('#picked'), picked = chips.filter(function (i) { return i.checked && i !== none; });
    list.innerHTML = '';
    var items = picked.length ? picked.map(function (i) { return COND[Number(i.value)]; }) : [none.checked ? '以上皆無' : '未勾選任何項目'];
    items.forEach(function (tx) { var li = document.createElement('li'); li.textContent = tx; list.appendChild(li); });
  }

  /* ── 啟動 ── */
  var roT;
  function relayout() { alignRail(); syncS1(); drawBand(); measureTone(); onScroll(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { clearTimeout(roT); roT = setTimeout(relayout, 60); });
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  relayout();
})();

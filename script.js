/* ═══════════════════════════════════════════════════════════
   个人主页交互脚本
   不需要改这里，除非你想加新功能。
   每一块前面都写了它在干什么。
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const root = document.documentElement;

  /* ───────── 1. 页脚年份自动更新 ───────── */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ───────── 2. 深浅色切换（会记住你的选择） ───────── */
  const themeBtn = document.getElementById('themeBtn');
  const themeIcon = document.getElementById('themeIcon');

  function paintThemeIcon() {
    const isDark = root.dataset.theme === 'dark';
    if (themeIcon) themeIcon.textContent = isDark ? '☀' : '☾';
    if (themeBtn) themeBtn.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到深色模式');
  }

  paintThemeIcon();

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
      paintThemeIcon();
    });
  }

  /* ───────── 3. 滚动时给导航栏加毛玻璃背景 ───────── */
  const nav = document.getElementById('nav');

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ───────── 4. 手机端菜单 ───────── */
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');

  function closeMenu() {
    if (!navLinks || !menuBtn) return;
    navLinks.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', '打开菜单');
  }

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      const open = navLinks.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });

    // 点了链接就收起菜单
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // 按 Esc 或点到外面也收起
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', function (e) {
      if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) closeMenu();
    });
  }

  /* ───────── 5. 内容滚动进场（淡入 + 上移） ───────── */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    revealEls.forEach(function (el, i) {
      // 同一批里的元素错开一点点出现，看起来更自然
      el.style.transitionDelay = Math.min(i, 6) * 45 + 'ms';
      io.observe(el);
    });
  } else {
    // 老浏览器：直接显示
    revealEls.forEach(function (el) {
      el.classList.add('is-in');
    });
  }

  // 保险丝：如果 1.2 秒后一个都没显示出来，说明观察器没生效，
  // 直接全部显示，绝不让页面空着。
  window.setTimeout(function () {
    if (document.querySelector('.reveal.is-in')) return;
    revealEls.forEach(function (el) {
      el.style.transitionDelay = '0ms';
      el.classList.add('is-in');
    });
  }, 1200);

  /* ───────── 6. 导航高亮当前所在区块 ───────── */
  const sections = Array.prototype.slice.call(
    document.querySelectorAll('main section[id]')
  );
  const linkMap = {};

  if (navLinks) {
    navLinks.querySelectorAll('a[href^="#"]').forEach(function (a) {
      linkMap[a.getAttribute('href').slice(1)] = a;
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          Object.keys(linkMap).forEach(function (id) {
            linkMap[id].classList.toggle('is-active', id === entry.target.id);
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(function (s) {
      spy.observe(s);
    });
  }

  /* ───────── 7. 小提示条 ───────── */
  const toast = document.getElementById('toast');
  let toastTimer;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-show');
    }, 2600);
  }

  // 所有 href="#" 且带 data-placeholder 的链接，先提示「这里还没填」
  document.querySelectorAll('a[data-placeholder]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      showToast('这一项还是占位内容，把它换成你的作品链接就好 ✏️');
    });
  });

  /* ───────── 8. 一键复制邮箱 ───────── */
  const copyBtn = document.getElementById('copyBtn');
  const mailLink = document.getElementById('mailLink');

  // 老办法复制：双击打开本地文件、或浏览器不给剪贴板权限时用它
  function legacyCopy(text) {
    const tmp = document.createElement('textarea');
    tmp.value = text;
    tmp.setAttribute('readonly', '');
    tmp.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(tmp);
    tmp.select();
    tmp.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(tmp);
    return ok;
  }

  // 给剪贴板操作加个超时：万一浏览器既不成功也不报错，也别让按钮卡住
  function withTimeout(promise, ms) {
    return Promise.race([
      promise.then(function () { return true; }).catch(function () { return false; }),
      new Promise(function (resolve) { setTimeout(function () { resolve(false); }, ms); }),
    ]);
  }

  if (copyBtn && mailLink) {
    copyBtn.addEventListener('click', async function () {
      const email = mailLink.textContent.trim();
      const label = copyBtn.querySelector('.copy-btn__label');
      let ok = false;

      if (navigator.clipboard && window.isSecureContext) {
        ok = await withTimeout(navigator.clipboard.writeText(email), 600);
      }
      if (!ok) ok = legacyCopy(email); // 权限被拒 / 超时：退回老办法

      if (!ok) {
        showToast('复制没成功，手动选中邮箱复制一下吧');
        return;
      }

      if (label) label.textContent = '已复制';
      copyBtn.classList.add('is-done');
      setTimeout(function () {
        if (label) label.textContent = '复制';
        copyBtn.classList.remove('is-done');
      }, 2000);
    });
  }
})();

/* ═══════════════════════════════════════════════════════════
   9. 点开看大图（灯箱）
   ───────────────────────────────────────────────────────────
   点照片 → 铺满屏幕看大图；← → 切换；Esc 关闭。
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const lb = document.getElementById('lightbox');
  if (!lb) return;

  // 专区和照片墙可能引用同一张图：灯箱里只保留一份，但每个入口都要能点
  const allPhotos = Array.prototype.slice.call(document.querySelectorAll('[data-photo]'));
  const photos = [];
  const keyToIndex = {};
  const elementIndex = new Map();

  allPhotos.forEach(function (btn) {
    const img = btn.querySelector('img');
    const key = img ? img.getAttribute('src') : btn.getAttribute('data-caption');
    let i = keyToIndex[key];
    if (i === undefined) {
      i = photos.length;
      keyToIndex[key] = i;
      photos.push(btn);
    }
    elementIndex.set(btn, i);
  });
  if (!photos.length) return;

  const imgEl = document.getElementById('lbImg');
  const phEl = document.getElementById('lbPh');
  const capEl = document.getElementById('lbCap');
  const countEl = document.getElementById('lbCount');
  const btnClose = document.getElementById('lbClose');
  const btnPrev = document.getElementById('lbPrev');
  const btnNext = document.getElementById('lbNext');

  let index = 0;
  let lastFocus = null;
  let hideTimer = null;

  // 先解除 hidden，之后靠 .is-open 控制显隐（这样才有淡入效果）
  lb.hidden = false;

  // 只取颜色变量（ph--2 这种），不要取尺寸（ph--tall）
  function colorVariant(el) {
    return Array.prototype.filter.call(el.classList, function (c) {
      return /^ph--\d+$/.test(c);
    }).join(' ');
  }

  function render() {
    const btn = photos[index];
    const ph = btn.querySelector('.ph');
    const img = btn.querySelector('img');

    if (img) {
      imgEl.src = img.getAttribute('src');
      imgEl.alt = img.getAttribute('alt') || '';
      imgEl.hidden = false;
      phEl.hidden = true;
    } else {
      imgEl.hidden = true;
      imgEl.removeAttribute('src');
      phEl.hidden = false;
      phEl.className = 'ph lb__ph ' + (ph ? colorVariant(ph) : '');
    }

    capEl.textContent = btn.getAttribute('data-caption') || '';
    countEl.textContent = index + 1 + ' / ' + photos.length;
  }

  function open(i) {
    index = i;
    lastFocus = document.activeElement;
    clearTimeout(hideTimer);
    render();
    lb.hidden = false;
    requestAnimationFrame(function () {
      lb.classList.add('is-open');
    });
    document.body.classList.add('is-locked');
    if (btnClose) btnClose.focus();
  }

  function close() {
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    hideTimer = setTimeout(function () {
      lb.hidden = true;
    }, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function go(step) {
    index = (index + step + photos.length) % photos.length;
    render();
  }

  allPhotos.forEach(function (btn) {
    btn.addEventListener('click', function () {
      open(elementIndex.get(btn));
    });
  });

  if (btnClose) btnClose.addEventListener('click', close);
  if (btnPrev) btnPrev.addEventListener('click', function () { go(-1); });
  if (btnNext) btnNext.addEventListener('click', function () { go(1); });

  // 点背景关闭
  lb.addEventListener('click', function (e) {
    if (e.target === lb) close();
  });

  // 键盘：Esc 关闭，左右方向键切换
  document.addEventListener('keydown', function (e) {
    if (lb.hidden || !lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  });
})();

/* ═══════════════════════════════════════════════════════════
   10. 复制文字（抖音号这种没有公开链接的账号）
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const items = document.querySelectorAll('[data-copy]');
  if (!items.length) return;

  const toast = document.getElementById('toast');
  let timer;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(timer);
    timer = setTimeout(function () {
      toast.classList.remove('is-show');
    }, 2800);
  }

  function legacyCopy(text) {
    const tmp = document.createElement('textarea');
    tmp.value = text;
    tmp.setAttribute('readonly', '');
    tmp.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(tmp);
    tmp.select();
    tmp.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(tmp);
    return ok;
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise.then(function () { return true; }).catch(function () { return false; }),
      new Promise(function (resolve) { setTimeout(function () { resolve(false); }, ms); }),
    ]);
  }

  items.forEach(function (el) {
    el.addEventListener('click', async function (e) {
      e.preventDefault();
      const text = el.getAttribute('data-copy');
      let ok = false;
      if (navigator.clipboard && window.isSecureContext) {
        ok = await withTimeout(navigator.clipboard.writeText(text), 600);
      }
      if (!ok) ok = legacyCopy(text);
      showToast(ok ? '抖音号已复制：' + text : '没复制成功，抖音号是 ' + text);
    });
  });
})();

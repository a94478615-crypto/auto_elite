/* ==========================================================
   AUTO ELITE — script.js
   Language switching (EN / DE / FA), search filter, menu,
   favorites and small demo notices.
   ========================================================== */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* ---------- Loading screen ----------
   Gauge fills while the page loads, the wheel spins up,
   then the "garage doors" open. A CSS failsafe hides it after 7 s. */
(function loadingScreen() {
  const el = $('#loader');
  if (!el) return;
  document.body.classList.add('loading');

  const arc = $('#gaugeArc');
  const pct = $('#loaderPct');
  const wheel = $('.loader-wheel');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = reduce ? 300 : 2000;   // shortest time the screen stays up (ms)
  const CAP = 4500;                  // never wait longer than this for the page (ms)
  const t0 = performance.now();
  let loaded = document.readyState === 'complete';
  let p = 0, angle = 0, last = t0;

  if (!loaded) addEventListener('load', () => (loaded = true), { once: true });

  function open() {
    arc.style.strokeDashoffset = 0;
    pct.textContent = '100%';
    el.classList.add('done');
    setTimeout(() => {
      el.remove();
      document.body.classList.remove('loading');
    }, 1500);
  }

  function frame(now) {
    const t = now - t0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const canFinish = (loaded || t > CAP) && t >= MIN;
    const fake = 1 - Math.pow(1 - Math.min(t / MIN, 1), 2.4);
    p += (Math.min(fake, canFinish ? 1 : 0.9) - p) * Math.min(1, dt * 8);

    arc.style.strokeDashoffset = 100 * (1 - p);
    pct.textContent = Math.round(p * 100) + '%';
    angle += (90 + p * 1100) * dt;
    wheel.style.transform = 'rotate(' + angle + 'deg)';

    if (canFinish && p > 0.995) return open();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

const LANGS = {
  en: { dir: 'ltr', title: 'AUTO ELITE — Premium Cars' },
  de: { dir: 'ltr', title: 'AUTO ELITE — Premium-Fahrzeuge' },
  fa: { dir: 'rtl', title: 'اتو الیت — خودروهای لوکس' }
};

let mode = 'buy';
let lang = 'en';
let noticeTimer;

/* ---------- Notice (small toast at the bottom) ---------- */
function notice(en, de, fa) {
  const n = $('#notice');
  n.textContent = { en, de, fa }[lang];
  n.style.display = 'block';
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (n.style.display = 'none'), 3000);
}

/* ---------- Language ----------
   Every translatable element carries data-en / data-de / data-fa.
   Persian also switches the page direction to right-to-left. */
function applyLanguage(code, announce) {
  if (!LANGS[code]) code = 'en';
  lang = code;

  const root = document.documentElement;
  root.lang = code;
  root.dir = LANGS[code].dir;
  document.title = LANGS[code].title;

  $$('[data-en]').forEach(el => {
    if (el.dataset[code] !== undefined) el.textContent = el.dataset[code];
  });
  $('#language').value = code;

  try { localStorage.setItem('ae-lang', code); } catch (e) {}

  if (announce) {
    notice('Language changed.', 'Sprache geändert.', 'زبان تغییر کرد.');
  }
}

$('#language').addEventListener('change', e => applyLanguage(e.target.value, true));

/* ---------- Buy / Rent mode + filtering ---------- */
function filter() {
  const brand = $('#brand').value;
  const body = $('#body').value;
  const max = $('#maxprice').value;
  const year = $('#year').value;
  let count = 0;

  $$('.car').forEach(car => {
    const ok =
      (brand === 'all' || car.dataset.brand === brand) &&
      (body === 'all' || car.dataset.body === body) &&
      (max === 'all' || +car.dataset.price <= +max) &&
      (year === 'all' || +car.dataset.year >= +year) &&
      car.dataset.mode === mode;
    car.style.display = ok ? '' : 'none';
    if (ok) count++;
  });

  $('#noResults').style.display = count ? 'none' : 'block';
}

function setMode(m) {
  mode = m;
  $$('.mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  filter();
}

$$('.mode button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

$('#searchBtn').addEventListener('click', () => {
  filter();
  $('#cars').scrollIntoView({ behavior: 'smooth' });
  notice(
    'Demo search applied; listings are sample data.',
    'Demo-Suche angewendet; Anzeigen sind Beispieldaten.',
    'جستجوی نمایشی انجام شد؛ آگهی‌ها نمونه هستند.'
  );
});

$('#rentBtn').addEventListener('click', () => {
  setMode('rent');
  $('#cars').scrollIntoView({ behavior: 'smooth' });
});

$('#jumpSearch').addEventListener('click', () =>
  $('#search').scrollIntoView({ behavior: 'smooth', block: 'center' })
);

/* ---------- Header menu (mobile overlay) ---------- */
function setMenu(open) {
  $('#nav').classList.toggle('open', open);
  $('#menu').classList.toggle('open', open);
  $('#menu').setAttribute('aria-expanded', open);
  document.body.classList.toggle('menu-open', open);
}

$('#menu').addEventListener('click', () => setMenu(!$('#nav').classList.contains('open')));

$$('#nav a').forEach((a, i) => {
  a.style.setProperty('--i', i); // stagger delay for the mobile menu
  a.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') setMenu(false);
});

addEventListener('resize', () => {
  if (innerWidth > 1160) setMenu(false);
});

/* Highlight the nav link of the section currently in view */
const spyIds = ['#home', '#cars', '#rent', '#contact'];

function spy() {
  let current = '#home';
  spyIds.forEach(id => {
    const section = $(id);
    if (section && section.getBoundingClientRect().top <= 140) current = id;
  });
  $$('#nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === current));
}

addEventListener('scroll', spy, { passive: true });
spy();

/* ---------- Favorites, account, listing (demo only) ---------- */
$$('.heart').forEach(b =>
  b.addEventListener('click', () => {
    b.classList.toggle('saved');
    b.textContent = b.classList.contains('saved') ? '♥' : '♡';
    notice('Demo favorite updated.', 'Demo-Favorit aktualisiert.', 'علاقه‌مندی نمایشی به‌روزرسانی شد.');
  })
);

$('#account').addEventListener('click', () =>
  notice(
    'Sign-in will be added in the full version.',
    'Die Anmeldung wird in der Vollversion ergänzt.',
    'ورود به حساب در نسخه‌ی کامل اضافه می‌شود.'
  )
);

$('#listCar').addEventListener('click', () =>
  notice(
    'Demo only: listing submission is not connected to a database.',
    'Nur Demo: Inserate sind nicht mit einer Datenbank verbunden.',
    'فقط نمایشی: ثبت آگهی به پایگاه داده وصل نیست.'
  )
);


/* ---------- Spinning wheel next to the logo ----------
   Idles slowly, speeds up when you scroll (like driving) or hover the logo,
   and blurs slightly at speed. Static if the visitor prefers reduced motion. */
(function logoWheel() {
  const wheels = [...$$('.wheelmark .wheel')];
  if (!wheels.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const IDLE = 45;    // degrees per second at rest
  const MAX = 1500;   // top extra speed from scrolling
  let angle = 0, boost = 0, hover = 0, hoverNow = 0;
  let lastY = scrollY, last = performance.now();

  addEventListener('scroll', () => {
    boost = Math.min(boost + Math.abs(scrollY - lastY) * 9, MAX);
    lastY = scrollY;
  }, { passive: true });

  $$('.logo').forEach(l => {
    l.addEventListener('mouseenter', () => (hover = 1));
    l.addEventListener('mouseleave', () => (hover = 0));
  });

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    boost *= Math.pow(0.04, dt);
    hoverNow += (hover - hoverNow) * Math.min(1, dt * 4);
    const speed = IDLE + boost + hoverNow * 420;
    angle = (angle + speed * dt) % 360;
    const blur = Math.min(speed / 1500, 1) * 1.6;
    wheels.forEach(w => {
      w.style.transform = 'rotate(' + angle.toFixed(1) + 'deg)';
      w.style.filter = blur > 0.15 ? 'blur(' + blur.toFixed(2) + 'px)' : '';
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* ---------- Start ---------- */
$('#yearNow').textContent = new Date().getFullYear();

let savedLang = null;
try { savedLang = localStorage.getItem('ae-lang'); } catch (e) {}
if (savedLang && savedLang !== 'en') applyLanguage(savedLang, false);

filter();

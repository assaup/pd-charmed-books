// page24.js — анимация сцены страницы 24: «Трёхсторонний звонок, мир рушится».
// 1. Сигнал: по неоновой линии бегут импульсы — то от Даяны, то от парня,
//    как реплики в разговоре; телефон говорящего вспыхивает.
// 2. Трещина: раз в несколько секунд картинка на миг раскалывается по линии,
//    половины разъезжаются с цветным глитчем и встают на место.
// Отладка из консоли: debugCrack() — трещина вручную, debugPhrase(0|1) — реплика.

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация: разговор
  var INITIAL_DELAY = 900;          // пауза перед первой репликой, мс
  var PHRASE_MIN = 1400;            // пауза между репликами, мс
  var PHRASE_MAX = 2800;
  var PULSES_MIN = 1;               // импульсов в одной реплике
  var PULSES_MAX = 3;
  var PULSE_GAP = 260;              // интервал между импульсами реплики, мс
  var PULSE_TIME = 1300;            // время пробега импульса по линии, мс
  var SAME_SPEAKER = 0.3;           // шанс, что говорит тот же, кто и до этого

  // Конфигурация: трещина
  var CRACK_FIRST = 4500;           // первая трещина, мс от старта
  var CRACK_MIN = 8000;             // интервал между трещинами, мс
  var CRACK_MAX = 12000;
  var CRACK_JUMPS_MIN = 3;          // сколько рывков в одном глитче
  var CRACK_JUMPS_MAX = 5;
  var CRACK_SHIFT_MIN = 0.4;        // сдвиг половин, % сцены
  var CRACK_SHIFT_MAX = 1.3;

  // Амплитуды
  var LINE_BASE = 0.35;             // подсветка линии в покое
  var LINE_PULSE = 0.15;            // её «дыхание»
  var LINE_PERIOD = 3200;
  var PHONE_BASE = 0.15;            // телефоны в покое
  var PHONE_FLASH = 0.75;           // вспышка при реплике
  var PHONE_DECAY = 600;            // как быстро гаснет вспышка, мс

  // Утилиты, переносятся в любой pageN.js
  var TWO_PI = Math.PI * 2;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // Элементы сцены
  var lineGlow = document.getElementById('line-glow');
  var pulseEls = Array.prototype.slice.call(document.querySelectorAll('#signal .pulse'));
  var phones = [document.getElementById('phone-dayana'), document.getElementById('phone-mike')];
  var halfA = document.getElementById('half-a');
  var halfB = document.getElementById('half-b');
  var gap = document.getElementById('crack-gap');

  // ---------- Разговор ----------

  // Линия идёт сверху (сторона Даяны) вниз (сторона парня).
  // Говорит Даяна (0) — импульс бежит вниз, парень (1) — вверх.
  var pulses = pulseEls.map(function (el) { return { el: el, alive: false }; });
  var pending = [];                 // [{ at, speaker }] — импульсы в очереди
  var flash = [0, 0];
  var speaker = 0;
  var nextPhrase = 0;

  function phrase(now, who) {
    if (who === undefined) {
      who = Math.random() < SAME_SPEAKER ? speaker : 1 - speaker;
    }
    speaker = who;
    var n = randInt(PULSES_MIN, PULSES_MAX);
    for (var i = 0; i < n; i++) pending.push({ at: now + i * PULSE_GAP, speaker: who });
    nextPhrase = now + (n - 1) * PULSE_GAP + rand(PHRASE_MIN, PHRASE_MAX);
  }

  function launch(now, who) {
    var p = null;
    for (var i = 0; i < pulses.length; i++) {
      if (!pulses[i].alive) { p = pulses[i]; break; }
    }
    if (!p) return;
    p.alive = true;
    p.born = now;
    p.down = who === 0;
    flash[who] = 1;
  }

  // dashoffset 5 — штрих перед началом линии, -100 — уже за её концом
  function drawPulse(p, now) {
    var t = (now - p.born) / PULSE_TIME;
    if (t >= 1) {
      p.alive = false;
      p.el.style.opacity = '0';
      return;
    }
    var k = easeInOut(t);
    var offset = p.down ? mix(5, -100, k) : mix(-100, 5, k);
    p.el.style.strokeDashoffset = offset.toFixed(2);
    p.el.style.opacity = '1';
  }

  // ---------- Трещина ----------

  var crack = null;                 // { steps: [{ at, shift }], end }
  var nextCrack = 0;

  function startCrack(now) {
    var steps = [];
    var at = now;
    var jumps = randInt(CRACK_JUMPS_MIN, CRACK_JUMPS_MAX);
    for (var i = 0; i < jumps; i++) {
      steps.push({ at: at, shift: rand(CRACK_SHIFT_MIN, CRACK_SHIFT_MAX) * (Math.random() < 0.85 ? 1 : -0.5) });
      at += rand(50, 110);
    }
    crack = { steps: steps, end: at };
    nextCrack = now + rand(CRACK_MIN, CRACK_MAX);
  }

  // Половины разъезжаются перпендикулярно линии: она идёт примерно
  // по диагонали ↘, значит сторона Даяны уходит ↗, сторона парня ↙.
  // CRACK_ZOOM чуть увеличивает половины, чтобы при сдвиге
  // у краёв сцены не открывались пустые полосы
  var CRACK_ZOOM = 1.03;

  function setCrack(shift, visible) {
    var v = visible ? 'visible' : 'hidden';
    if (halfA) {
      halfA.style.visibility = v;
      halfA.style.transform = 'translate(' + shift.toFixed(2) + '%, ' + (-shift).toFixed(2) + '%) scale(' + CRACK_ZOOM + ')';
    }
    if (halfB) {
      halfB.style.visibility = v;
      halfB.style.transform = 'translate(' + (-shift).toFixed(2) + '%, ' + shift.toFixed(2) + '%) scale(' + CRACK_ZOOM + ')';
    }
    if (gap) gap.style.opacity = visible ? '1' : '0';
  }

  // Возвращает true, пока идёт трещина — линия в это время мерцает
  function drawCrack(now) {
    if (!crack) return false;
    if (now >= crack.end) {
      crack = null;
      setCrack(0, false);
      return false;
    }
    var shift = 0;
    for (var i = 0; i < crack.steps.length; i++) {
      if (now >= crack.steps[i].at) shift = crack.steps[i].shift;
    }
    setCrack(shift, true);
    return true;
  }

  // ---------- Кадр ----------

  function drawLights(now, cracking) {
    if (lineGlow) {
      var breath = (Math.sin(now * TWO_PI / LINE_PERIOD) + 1) / 2;
      var o = LINE_BASE + breath * LINE_PULSE;
      if (cracking) o = Math.random() < 0.5 ? 1 : 0.1;   // мерцание при трещине
      lineGlow.style.opacity = o.toFixed(3);
    }
    for (var i = 0; i < phones.length; i++) {
      if (phones[i]) phones[i].style.opacity = clamp(PHONE_BASE + flash[i] * PHONE_FLASH, 0, 1).toFixed(3);
    }
  }

  function init() {
    // Стартовое состояние из JS: сломается скрипт — останется картинка
    setCrack(0, false);
    if (lineGlow) lineGlow.style.opacity = String(LINE_BASE);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var last = null;
    requestAnimationFrame(function loop(now) {
      if (last === null) {
        last = now;
        nextPhrase = now + INITIAL_DELAY;
        nextCrack = now + CRACK_FIRST;
      }
      // Вкладка была скрыта — не наверстываем пропущенное разом
      var dt = Math.min(now - last, 50);
      last = now;

      if (now >= nextPhrase) phrase(now);
      for (var i = pending.length - 1; i >= 0; i--) {
        if (now >= pending[i].at) { launch(now, pending[i].speaker); pending.splice(i, 1); }
      }

      if (!crack && now >= nextCrack) startCrack(now);
      var cracking = drawCrack(now);

      flash[0] *= Math.exp(-dt / PHONE_DECAY);
      flash[1] *= Math.exp(-dt / PHONE_DECAY);
      drawLights(now, cracking);
      for (var j = 0; j < pulses.length; j++) {
        if (pulses[j].alive) drawPulse(pulses[j], now);
      }

      requestAnimationFrame(loop);
    });
  }

  window.debugCrack = function () { startCrack(performance.now()); };
  window.debugPhrase = function (who) { phrase(performance.now(), who); };

  init();
});
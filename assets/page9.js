// page9.js — анимация сцены страницы 9: мигающая лампа над столом.
// drawFrame(level) рисует свет лампы для яркости level из [0, 1]:
// 1 — лампа горит как на картинке, 0 — погасла.
// Откуда берётся level — дело драйвера (сейчас — генератор мигания).
// Отладка из консоли: debugLight(0.3)

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var INITIAL_DELAY = 1500;           // пауза перед первым миганием, мс
  var STEADY_MIN = 2500;              // спокойное горение между сериями, мс
  var STEADY_MAX = 6500;
  var BLINKS_MIN = 2;                 // сколько раз моргает за серию
  var BLINKS_MAX = 5;
  var LONG_OFF_CHANCE = 0.25;         // шанс, что лампа погаснет надолго
  var SMOOTH = 30;                    // инерция нити накала, мс (0 — мгновенно)

  // Амплитуды
  var SHADE_MAX = 0.75;               // насколько темнеет сцена при level = 0
  var GLOW_MAX = 0.35;                // добавочный свет при level = 1
  var HUM = 0.04;                     // лёгкое «дрожание» света при горении

  // Утилиты, переносятся в любой pageN.js
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }

  // Элементы сцены
  var shade = document.getElementById('shade');
  var glow = document.getElementById('glow');

  // Кадр сцены: только две прозрачности, никаких transform
  function drawFrame(level) {
    level = clamp(level, 0, 1);
    if (shade) shade.style.opacity = ((1 - level) * SHADE_MAX).toFixed(3);
    if (glow) glow.style.opacity = (level * GLOW_MAX).toFixed(3);
  }

  // Драйвер: очередь шагов { level, dur }. Кончилась — генерируем
  // новую серию «горит спокойно → моргает».
  var queue = [];

  function pushBurst() {
    var blinks = randInt(BLINKS_MIN, BLINKS_MAX);
    for (var i = 0; i < blinks; i++) {
      queue.push({ level: rand(0.05, 0.35), dur: rand(40, 140) });   // провал
      queue.push({ level: rand(0.8, 1), dur: rand(50, 220) });       // вспышка
    }
    if (Math.random() < LONG_OFF_CHANCE) {
      queue.push({ level: 0.05, dur: rand(350, 800) });               // погасла
      queue.push({ level: 0.6, dur: 70 });                            // дёрнулась
      queue.push({ level: 0.1, dur: 90 });
    }
  }

  function pushSteady() {
    queue.push({ level: 1, dur: rand(STEADY_MIN, STEADY_MAX), steady: true });
  }

  function makeFlickerDriver() {
    var step = null;
    var stepEnd = 0;
    var start = null;
    var current = 1;
    var last = null;

    return function (now) {
      if (start === null) {
        start = now;
        queue.push({ level: 1, dur: INITIAL_DELAY, steady: true });
        pushBurst();
      }

      if (!step || now >= stepEnd) {
        if (!queue.length) { pushSteady(); pushBurst(); }
        step = queue.shift();
        stepEnd = now + step.dur;
      }

      var target = step.level;
      if (step.steady) target -= HUM * Math.random();

      // Лампа не переключается мгновенно — сглаживаем к цели
      var dt = last === null ? 16 : now - last;
      last = now;
      var k = SMOOTH > 0 ? 1 - Math.exp(-dt / SMOOTH) : 1;
      current += (target - current) * k;
      return current;
    };
  }

  function init() {
    // Стартовое состояние из JS: сломается скрипт — читатель
    // увидит сцену как на картинке
    drawFrame(1);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var driver = makeFlickerDriver();
    requestAnimationFrame(function loop(now) {
      drawFrame(driver(now));
      requestAnimationFrame(loop);
    });
  }

  window.debugLight = function (level) { drawFrame(level); };

  init();
});
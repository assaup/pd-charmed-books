// page19.js — анимация сцены страницы 19: «Сообщение от Сайферия».
// Экран ноутбука светится и время от времени вспыхивает — «пришло
// сообщение». Из экрана к лицу Даяны летят пиксели (SVG-прямоугольники):
// двигаются рывками по сетке, мерцают, гаснут у лица.
// Отладка из консоли: debugMessage() — вызвать «сообщение» вручную.

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var INITIAL_DELAY = 1200;         // пауза перед первым сообщением, мс
  var MSG_MIN = 4000;               // интервал между «сообщениями», мс
  var MSG_MAX = 8000;
  var BURST_MIN = 12;               // пикселей в одном сообщении
  var BURST_MAX = 20;
  var BURST_SPREAD = 700;           // за сколько мс вылетает вся пачка
  var IDLE_RATE = 3;                // пикселей в секунду между сообщениями
  var LIFE_MIN = 2600;              // время полёта пикселя, мс
  var LIFE_MAX = 4600;
  var POOL = 60;                    // максимум пикселей на экране
  var GRID = 0.5;                   // шаг сетки, % сцены (рывки «по пикселям»)

  // Геометрия (в % сцены, по bg.png)
  var FROM = { x: [25, 29], y: [47, 56] };   // правая часть экрана ноутбука
  var TO = { x: [56, 66], y: [34, 44] };     // область у лица Даяны

  // Свечение экрана
  var GLOW_BASE = 0.45;             // обычная яркость
  var GLOW_PULSE = 0.10;            // размах «дыхания» экрана
  var GLOW_PERIOD = 2600;           // период дыхания, мс
  var GLOW_FLASH = 0.55;            // прибавка при сообщении
  var FLASH_DECAY = 450;            // как быстро гаснет вспышка, мс

  // Утилиты, переносятся в любой pageN.js
  var TWO_PI = Math.PI * 2;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
  function snap(v) { return Math.round(v / GRID) * GRID; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // Элементы сцены
  var glow = document.getElementById('screen-glow');
  var svg = document.getElementById('pixels');
  var SVG_NS = 'http://www.w3.org/2000/svg';

  // Пул пикселей: прямоугольники создаём один раз и переиспользуем
  var pool = [];
  for (var i = 0; svg && i < POOL; i++) {
    var rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('opacity', '0');
    svg.appendChild(rect);
    pool.push({ el: rect, alive: false });
  }

  function spawn(now) {
    var p = null;
    for (var i = 0; i < pool.length; i++) {
      if (!pool[i].alive) { p = pool[i]; break; }
    }
    if (!p) return;

    // Размеры как у нарисованных пикселей: квадраты и полоски
    var w = Math.random() < 0.7 ? rand(0.8, 1.8) : rand(2, 3.5);
    var h = Math.random() < 0.7 ? w : rand(0.5, 1.2);

    p.alive = true;
    p.born = now;
    p.life = rand(LIFE_MIN, LIFE_MAX);
    p.x0 = rand(FROM.x[0], FROM.x[1]);
    p.y0 = rand(FROM.y[0], FROM.y[1]);
    p.x1 = rand(TO.x[0], TO.x[1]);
    p.y1 = rand(TO.y[0], TO.y[1]);
    p.wobble = rand(0.5, 1.8);          // размах виляния поперёк пути
    p.phase = rand(0, TWO_PI);
    p.alpha = rand(0.55, 1);
    p.on = true;
    p.nextToggle = now + rand(80, 220);

    p.el.setAttribute('width', snap(w) || GRID);
    p.el.setAttribute('height', snap(h) || GRID);
  }

  // Кадр одного пикселя
  function drawPixel(p, now) {
    var t = (now - p.born) / p.life;
    if (t >= 1) {
      p.alive = false;
      p.el.setAttribute('opacity', '0');
      return;
    }

    var k = easeOut(t);
    // Поперёк пути пиксель слегка виляет — как помехи
    var side = Math.sin(t * TWO_PI * 1.5 + p.phase) * p.wobble * (1 - t);
    var x = mix(p.x0, p.x1, k) + side * 0.5;
    var y = mix(p.y0, p.y1, k) + side;

    // Мерцание: пиксель иногда «пропадает» на долю секунды
    if (now >= p.nextToggle) {
      p.on = p.on ? Math.random() > 0.25 : true;
      p.nextToggle = now + rand(60, 200);
    }

    var fade = Math.min(t / 0.08, 1) * Math.min((1 - t) / 0.3, 1);
    var a = p.on ? p.alpha * fade : 0;

    p.el.setAttribute('x', snap(x));
    p.el.setAttribute('y', snap(y));
    p.el.setAttribute('opacity', a.toFixed(2));
  }

  // Состояние «сообщений»
  var flash = 0;
  var nextMsg = 0;
  var burstQueue = [];              // моменты вылета пикселей пачки
  var idleAcc = 0;

  function message(now) {
    flash = 1;
    var n = randInt(BURST_MIN, BURST_MAX);
    for (var i = 0; i < n; i++) burstQueue.push(now + rand(0, BURST_SPREAD));
    nextMsg = now + rand(MSG_MIN, MSG_MAX);
  }

  function drawGlow(now) {
    if (!glow) return;
    var pulse = (Math.sin(now * TWO_PI / GLOW_PERIOD) + 1) / 2;
    var o = GLOW_BASE + pulse * GLOW_PULSE + flash * GLOW_FLASH;
    glow.style.opacity = clamp(o, 0, 1).toFixed(3);
  }

  function init() {
    // Стартовое состояние из JS: сломается скрипт — останется
    // просто нарисованная сцена
    if (glow) glow.style.opacity = String(GLOW_BASE);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var last = null;
    requestAnimationFrame(function loop(now) {
      if (last === null) { last = now; nextMsg = now + INITIAL_DELAY; }
      // Вкладка была скрыта — не наверстываем пропущенное разом
      var dt = Math.min(now - last, 50);
      last = now;

      if (now >= nextMsg) message(now);

      // Вылет пачки
      for (var i = burstQueue.length - 1; i >= 0; i--) {
        if (now >= burstQueue[i]) { spawn(now); burstQueue.splice(i, 1); }
      }

      // Редкие пиксели между сообщениями
      idleAcc += dt * IDLE_RATE / 1000;
      while (idleAcc >= 1) { spawn(now); idleAcc -= 1; }

      flash *= Math.exp(-dt / FLASH_DECAY);
      drawGlow(now);
      for (var j = 0; j < pool.length; j++) {
        if (pool[j].alive) drawPixel(pool[j], now);
      }

      requestAnimationFrame(loop);
    });
  }

  window.debugMessage = function () { message(performance.now()); };

  init();
});
// page40.js — сцена 40: пробуждение в больнице и допрос.
// p (0..1) — ход сцены, t — время для лампы и дыхания. Отладка: debugFrame(0.5)

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var DURATION = 16000;        // вся сцена, мс
  var INITIAL_DELAY = 500;     // пауза перед стартом, мс
  var BREATH_PERIOD = 6500;    // дыхание камеры, мс
  var BUZZ_PERIOD = 7300;      // как часто вздрагивает лампа, мс

  // Окна прогресса
  var W_WAKE = [0.00, 0.22];   // глаза открываются, фокус возвращается
  var W_LIGHT = [0.08, 0.40];  // проступает свет палаты
  var W_PRESS = [0.35, 1.00];  // допрос давит: холод, тень, виньетка

  // Амплитуды
  var WAKE_BLUR = 7;           // размытие в первый миг, px
  var CAM_SCALE = 1.07;        // наезд на лицо Даяны
  var BREATH_SCALE = 0.004;
  var LAMP_MAX = 0.65;
  var MOTES_MAX = 0.80;
  var DOOR_START = 0.55;       // тёплый свет от двери в начале
  var DOOR_END = 0.12;         // и к концу допроса
  var SHADOW_MAX = 0.55;
  var COLD_MAX = 0.40;
  var VIGNETTE_START = 0.35;
  var VIGNETTE_END = 0.85;

  // Утилиты
  var TWO_PI = Math.PI * 2;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function seg(p, w) { return clamp((p - w[0]) / (w[1] - w[0]), 0, 1); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function wave(t, period) { return Math.sin(t * TWO_PI / period); }

  // 0 → 1 → 0 внутри окна
  function bump(p, w) {
    var s = seg(p, w);
    return s > 0 && s < 1 ? Math.sin(s * Math.PI) : 0;
  }

  // Двойное мигание лампы раз в BUZZ_PERIOD
  function buzz(t) {
    var k = t % BUZZ_PERIOD;
    if (k > 260) return 1;
    return (k < 60 || (k > 140 && k < 190)) ? 0.45 : 1;
  }

  // Элементы сцены
  var bg = document.getElementById('bg');
  var lamp = document.getElementById('lamp');
  var motes = document.getElementById('motes');
  var door = document.getElementById('door');
  var shadow = document.getElementById('shadow');
  var cold = document.getElementById('cold');
  var drip = document.getElementById('drip');
  var vignette = document.getElementById('vignette');
  var blackout = document.getElementById('blackout');

  function drawFrame(p, t) {
    var wake = seg(p, W_WAKE);
    var light = easeOut(seg(p, W_LIGHT));
    var press = easeInOut(seg(p, W_PRESS));

    var breath = (wave(t, BREATH_PERIOD) + 1) / 2;
    var scale = mix(1, CAM_SCALE, easeInOut(p)) * (1 + breath * BREATH_SCALE);
    var camTransform = 'scale(' + scale.toFixed(4) + ')';

    // Размытие при пробуждении
    if (bg) {
      bg.style.transform = camTransform;
      var blur = WAKE_BLUR * (1 - easeOut(wake));
      bg.style.filter = blur > 0.05 ? 'blur(' + blur.toFixed(2) + 'px)' : '';
    }

    if (lamp) {
      lamp.style.transform = camTransform;
      lamp.style.opacity = (light * LAMP_MAX * buzz(t)).toFixed(3);
    }

    if (motes) {
      motes.style.transform = camTransform;
      motes.style.opacity = (light * MOTES_MAX).toFixed(3);
    }

    if (door) {
      door.style.transform = camTransform;
      door.style.opacity = (light * mix(DOOR_START, DOOR_END, press)).toFixed(3);
    }

    if (shadow) {
      shadow.style.transform = camTransform;
      shadow.style.opacity = (press * SHADOW_MAX).toFixed(3);
    }

    // Холод — на весь кадр, без камеры
    if (cold) cold.style.opacity = (press * COLD_MAX).toFixed(3);

    if (drip) {
      drip.style.transform = camTransform;
      drip.style.opacity = light.toFixed(3);
    }

    if (vignette) vignette.style.opacity = (mix(VIGNETTE_START, VIGNETTE_END, press) * light).toFixed(3);

    // Пробуждение с двумя морганиями
    if (blackout) {
      var dark = 1 - easeOut(wake) + 0.8 * bump(wake, [0.30, 0.48]) + 0.45 * bump(wake, [0.60, 0.72]);
      blackout.style.opacity = clamp(dark, 0, 1).toFixed(3);
    }
  }

  function makeTimerDriver() {
    var start = null;
    return function (now) {
      if (start === null) start = now;
      return (now - start - INITIAL_DELAY) / DURATION;
    };
  }

  function init() {
    drawFrame(0, 0);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawFrame(1, 1000);
      return;
    }

    var driver = makeTimerDriver();

    // Цикл идёт и после финала — ради лампы и дыхания
    requestAnimationFrame(function loop(now) {
      drawFrame(clamp(driver(now), 0, 1), now);
      requestAnimationFrame(loop);
    });
  }

  window.debugFrame = function (p) { drawFrame(clamp(p, 0, 1), performance.now()); };

  init();
});

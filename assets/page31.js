// page31.js — анимация сцены страницы 31: встреча с братом.
// drawFrame(p, t) рисует кадр сцены для прогресса p из [0, 1]:
// 0 — первое мгновение объятия, 1 — мир вокруг растворился, остались двое.
// p крутит таймер и замирает на единице; дыхание камеры и пульс света
// живут по времени t и не останавливаются. Пылинки бегут на чистом CSS.
// Отладка из консоли: debugFrame(0.5)

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var DURATION = 10000;        // сколько длится «растворение мира», мс
  var INITIAL_DELAY = 800;     // пауза перед стартом, мс
  var BREATH_PERIOD = 6000;    // период дыхания камеры, мс
  var HALO_PERIOD = 4700;      // период пульса света за спиной, мс
  var SWAY_PERIOD = 9000;      // период покачивания пылинок, мс

  // Окна прогресса: что в какой отрезок [0..1] происходит
  var W_WARMTH = [0.15, 0.75]; // разгорается тепло объятия
  var W_VIGNETTE = [0.30, 1.00]; // края темнеют, мир уходит

  // Амплитуды
  var CAM_SCALE = 1.06;        // наезд на лицо Даяны
  var BREATH_SCALE = 0.005;    // дыхание камеры
  var HALO_START = 0.25;       // свет за спиной в начале
  var HALO_END = 0.45;         // и в конце
  var HALO_PULSE = 0.08;       // размах пульса
  var WARMTH_MAX = 0.60;       // предельное тепло объятия
  var VIGNETTE_MAX = 0.75;     // предельное затемнение краёв
  var MOTES_MAX = 0.85;        // яркость пылинок
  var SWAY = 0.6;              // покачивание пылинок, % от ширины сцены

  // Утилиты, переносятся в любой pageN.js
  var TWO_PI = Math.PI * 2;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }

  // Локальный прогресс 0..1 внутри окна w — чтобы слои включались по очереди
  function seg(p, w) { return clamp((p - w[0]) / (w[1] - w[0]), 0, 1); }

  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function wave(t, period) { return Math.sin(t * TWO_PI / period); }

  // Элементы сцены
  var bg = document.getElementById('bg');
  var halo = document.getElementById('halo');
  var warmth = document.getElementById('warmth');
  var motes = document.getElementById('motes');
  var vignette = document.getElementById('vignette');

  // Кадр сцены. p — ход сцены, t — время в мс для дыхания и пульса.
  // transform каждого слоя собирается одной строкой: второе присваивание
  // style.transform затёрло бы первое.
  function drawFrame(p, t) {
    var cam = easeInOut(p);
    var warmT = easeOut(seg(p, W_WARMTH));
    var vigT = easeInOut(seg(p, W_VIGNETTE));

    var breath = (wave(t, BREATH_PERIOD) + 1) / 2;   // 0..1
    var scale = mix(1, CAM_SCALE, cam) * (1 + breath * BREATH_SCALE);

    // Картинка и свет на ней — одна глубина, значит один transform
    var camTransform = 'scale(' + scale.toFixed(4) + ')';

    if (bg) bg.style.transform = camTransform;
    if (halo) {
      halo.style.transform = camTransform;
      halo.style.opacity = (mix(HALO_START, HALO_END, cam) + wave(t, HALO_PERIOD) * HALO_PULSE).toFixed(3);
    }
    if (warmth) {
      warmth.style.transform = camTransform;
      warmth.style.opacity = (warmT * WARMTH_MAX).toFixed(3);
    }

    // Пылинки летят сами (CSS), здесь только лёгкий снос в сторону
    if (motes) {
      motes.style.transform =
        'translateX(' + (wave(t, SWAY_PERIOD) * SWAY).toFixed(3) + '%) ' + camTransform;
      motes.style.opacity = (mix(0.4, 1, cam) * MOTES_MAX).toFixed(3);
    }

    // Виньетка привязана к кадру, а не к картинке, поэтому без transform
    if (vignette) vignette.style.opacity = (vigT * VIGNETTE_MAX).toFixed(3);
  }

  // Драйвер: таймер, сцена играет сама и замирает в финальном кадре
  function makeTimerDriver() {
    var start = null;
    return function (now) {
      if (start === null) start = now;
      return (now - start - INITIAL_DELAY) / DURATION;
    };
  }

  function init() {
    // Стартовое состояние задаём из JS, а не в CSS: сломается скрипт —
    // читатель увидит сцену ровно такой, как её нарисовали
    drawFrame(0, 0);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawFrame(1, 0);
      return;
    }

    var driver = makeTimerDriver();

    // Цикл крутится и после финала — дыхание и свет не должны замирать
    requestAnimationFrame(function loop(now) {
      drawFrame(clamp(driver(now), 0, 1), now);
      requestAnimationFrame(loop);
    });
  }

  window.debugFrame = function (p) { drawFrame(clamp(p, 0, 1), performance.now()); };

  init();
});

// page30.js — анимация сцены страницы 30: ночная дорога в Сан-Хосе.
// У этой сцены нет сюжетного прогресса, это непрерывная среда, поэтому
// drawFrame(t) зависит только от времени, а не от p из [0, 1].
// Огни за стеклом крутит CSS, на JS — качка машины, свет приборной
// панели и фары встречных. Отладка из консоли: debugSweep()

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Качка: медленное покачивание на подвеске плюс мелкая дрожь от асфальта.
  // Всё в % от размера сцены, при 900 px это доли пикселя
  var SWAY_X = 0.10;
  var SWAY_Y = 0.08;
  var SWAY_PERIOD_X = 8800;           // мс
  var SWAY_PERIOD_Y = 11900;
  var BUZZ = 0.035;
  var BUZZ_PERIOD = 88;               // мс
  var BASE_SCALE = 1.02;              // запас, чтобы при качке не вылезли края

  // Свет
  var ROAD_OPACITY = 0.85;            // яркость огней за стеклом
  var DASH_BASE = 0.22;               // свечение экрана панели
  var DASH_PULSE = 0.08;
  var DASH_PERIOD = 2400;             // мс

  // Фары встречных машин
  var SWEEP_MAX = 1;                  // яркость полосы
  var SWEEP_GAP_MIN = 4000;           // пауза между машинами, мс
  var SWEEP_GAP_MAX = 9000;
  var SWEEP_DUR_MIN = 800;            // сколько идёт одна вспышка, мс
  var SWEEP_DUR_MAX = 1400;
  var SWEEP_TRAVEL = 130;             // размах полосы, % от её ширины

  // Утилиты, переносятся в любой pageN.js
  var TWO_PI = Math.PI * 2;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  // Элементы сцены
  var bg = document.getElementById('bg');
  var road = document.getElementById('road');
  var dash = document.getElementById('dash');
  var sweep = document.getElementById('sweep');

  // Кадр сцены. t — время в мс.
  // transform каждого слоя собирается одной строкой: второе присваивание
  // style.transform затёрло бы первое.
  function drawFrame(t) {
    // Две синусоиды разной длины вместо одной: ровный период читался бы
    // как механическое колебание, а не как дорога
    var x = Math.sin(t * TWO_PI / SWAY_PERIOD_X) * SWAY_X +
      Math.sin(t * TWO_PI / BUZZ_PERIOD) * BUZZ;
    var y = Math.cos(t * TWO_PI / SWAY_PERIOD_Y) * SWAY_Y +
      Math.sin(t * TWO_PI / (BUZZ_PERIOD * 1.6)) * BUZZ * 0.7;

    // Картинка и привязанные к ней слои качаются вместе, иначе свет
    // «отклеится» от экрана панели и от стекла
    var shake =
      'translate(' + x.toFixed(3) + '%, ' + y.toFixed(3) + '%) ' +
      'scale(' + BASE_SCALE + ')';

    if (bg) bg.style.transform = shake;
    if (road) road.style.transform = shake;
    if (dash) {
      dash.style.transform = shake;
      dash.style.opacity =
        (DASH_BASE + Math.sin(t * TWO_PI / DASH_PERIOD) * DASH_PULSE).toFixed(3);
    }
  }

  // Фары встречной машины: пауза, потом полоса проходит по салону.
  // Состояние держим здесь, а не в drawFrame, чтобы кадр оставался
  // функцией одного времени
  var sweepStart = 0;
  var sweepDur = 0;
  var sweepNext = 0;
  var sweepDir = 1;

  function scheduleSweep(now) {
    sweepNext = now + rand(SWEEP_GAP_MIN, SWEEP_GAP_MAX);
  }

  function startSweep(now) {
    sweepStart = now;
    sweepDur = rand(SWEEP_DUR_MIN, SWEEP_DUR_MAX);
    sweepDir = Math.random() < 0.75 ? 1 : -1;   // чаще слева направо
  }

  function updateSweep(now) {
    if (!sweep) return;

    if (sweepStart === 0) {
      if (now >= sweepNext) startSweep(now);
      return;
    }

    var u = (now - sweepStart) / sweepDur;
    if (u >= 1) {
      sweep.style.opacity = '0';
      sweepStart = 0;
      scheduleSweep(now);
      return;
    }

    // Полоса едет насквозь, яркость всходит и гаснет по синусу —
    // машина приближается и уходит
    var travel = mix(-SWEEP_TRAVEL, SWEEP_TRAVEL, u) * sweepDir;
    sweep.style.transform = 'translateX(' + travel.toFixed(2) + '%)';
    sweep.style.opacity = (Math.sin(Math.PI * u) * SWEEP_MAX).toFixed(3);
  }

  function init() {
    // Стартовое состояние из JS: сломается скрипт — читатель увидит
    // сцену ровно такой, как её нарисовали
    if (road) road.style.opacity = ROAD_OPACITY;
    drawFrame(0);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    requestAnimationFrame(function loop(now) {
      if (sweepNext === 0) scheduleSweep(now);
      drawFrame(now);
      updateSweep(now);
      requestAnimationFrame(loop);
    });
  }

  window.debugSweep = function () { startSweep(performance.now()); };

  init();
});

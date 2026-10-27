// page23.js — анимация сцены страницы 23: два неоновых портрета на мониторе.
// На фоне (#bg) экран пустой, контуры девушки (#pink) и парня (#cyan) —
// отдельные слои. Они по кругу загораются и гаснут в противофазе:
// пока один разгорается, второй исчезает. Цикл бесконечный.
// drawFrame(phase) рисует кадр для фазы phase из [0, 1).
// Отладка из консоли: debugNeon(0.25) — показать кадр и остановить цикл

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var PERIOD = 6400;                  // полный цикл «девушка → парень → девушка», мс
  var MIN_OPACITY = 0;                // яркость слоя в самой тёмной точке
  var MAX_OPACITY = 1;                // и в самой яркой

  var pink = document.getElementById('pink');
  var cyan = document.getElementById('cyan');
  if (!pink || !cyan) return;

  // Плавная волна 0 → 1 → 0 за один цикл
  function wave(phase) {
    return 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI);
  }

  function drawFrame(phase) {
    var range = MAX_OPACITY - MIN_OPACITY;
    pink.style.opacity = (MIN_OPACITY + range * wave(phase)).toFixed(3);
    cyan.style.opacity = (MIN_OPACITY + range * wave(phase + 0.5)).toFixed(3);
  }

  var running = true;

  requestAnimationFrame(function loop(now) {
    if (!running) return;
    drawFrame((now % PERIOD) / PERIOD);
    requestAnimationFrame(loop);
  });

  window.debugNeon = function (phase) {
    running = false;
    drawFrame(phase);
  };
});

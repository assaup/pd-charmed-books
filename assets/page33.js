// page33.js — сцена страницы 33: город за панорамными окнами живёт.
// На каждое горящее окно кладётся тёмная «шторка» (.window в 33.css).
// Раз в пару секунд случайное окно гаснет, потом зажигается обратно,
// иногда с миганием — как свет в офисах вечером.
// Кнопка лифта пульсирует сама, на CSS.

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Горящие окна на bg.png: [left, top, width, height] в % сцены
  var WINDOWS = [
    [20.6, 34.6, 0.6, 0.5], [20.7, 51.1, 0.6, 0.5], [21.8, 52.2, 0.5, 0.6],
    [23.8, 45.2, 1.1, 1.8], [23.8, 48.6, 1.1, 1.8], [32.6, 41.0, 0.5, 1.4],
    [33.8, 35.9, 1.0, 1.6], [36.6, 41.0, 0.9, 1.1], [44.6, 45.3, 1.7, 0.6],
    [44.6, 49.4, 0.7, 0.6], [45.7, 50.4, 0.6, 0.6], [47.0, 45.3, 0.7, 0.5],
    [46.9, 53.0, 0.9, 0.7], [48.9, 44.2, 0.7, 0.8], [49.7, 49.0, 0.7, 0.9],
    [51.4, 46.3, 0.6, 0.5], [56.1, 50.2, 1.3, 0.7], [58.6, 46.1, 0.7, 0.7],
    [60.2, 44.5, 0.5, 0.7], [60.2, 49.2, 0.8, 0.7], [65.3, 41.0, 0.7, 0.5],
    [65.4, 49.4, 0.7, 1.1], [67.1, 42.4, 0.7, 1.6], [71.9, 39.7, 1.0, 1.6],
    [73.8, 39.7, 0.6, 1.5], [77.4, 47.6, 1.0, 1.2], [77.4, 50.9, 1.0, 1.1],
    [80.9, 35.9, 0.7, 0.5], [80.9, 37.2, 0.8, 0.5]
  ];

  var TICK_MIN = 700;        // как часто что-то меняется, мс
  var TICK_MAX = 1800;
  var OFF_MIN = 1500;        // сколько окно стоит погашенным, мс
  var OFF_MAX = 5000;
  var FLICKER_CHANCE = 0.35; // шанс, что окно перед сменой мигнёт

  function rand(a, b) { return a + Math.random() * (b - a); }

  var box = document.getElementById('windows');
  if (!box) return;

  var els = WINDOWS.map(function (w) {
    var el = document.createElement('div');
    el.className = 'window';
    el.style.left = w[0] + '%';
    el.style.top = w[1] + '%';
    el.style.width = w[2] + '%';
    el.style.height = w[3] + '%';
    box.appendChild(el);
    return el;
  });

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Мигнуть: пара быстрых переключений перед окончательным состоянием
  function flicker(el, done) {
    var steps = 2 + Math.floor(Math.random() * 3);
    (function step() {
      el.classList.toggle('is-off');
      if (--steps > 0) setTimeout(step, rand(60, 140));
      else done();
    })();
  }

  function tick() {
    var el = els[Math.floor(Math.random() * els.length)];
    if (!el.classList.contains('is-off')) {
      var turnOff = function () {
        el.classList.add('is-off');
        setTimeout(function () { el.classList.remove('is-off'); }, rand(OFF_MIN, OFF_MAX));
      };
      if (Math.random() < FLICKER_CHANCE) flicker(el, turnOff); else turnOff();
    }
    setTimeout(tick, rand(TICK_MIN, TICK_MAX));
  }

  setTimeout(tick, 1000);
});
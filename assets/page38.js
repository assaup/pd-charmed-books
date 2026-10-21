// page38.js — анимация сцены страницы 38: возвращение из бездны.
// drawFrame(p, t) рисует кадр сцены для прогресса p из [0, 1]:
// 0 — Даяна открывает глаза, вокруг темнота;
// дальше — сирена, красный свет, таймер самоуничтожения бежит с 09:00;
// ~0.86 — код введён на последних секундах, тревога гаснет;
// 1 — лаборатория снова синяя и тихая.
// p крутит таймер и замирает на единице; пульс сирены, мерцание мониторов
// и дыхание камеры живут по времени t.
// Отладка из консоли: debugFrame(0.5)

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var DURATION = 16000;        // вся сцена, мс
  var INITIAL_DELAY = 600;     // пауза перед стартом, мс
  var SIREN_PERIOD = 1100;     // период сирены, мс
  var BREATH_PERIOD = 6000;    // дыхание камеры после развязки, мс

  // Окна прогресса
  var W_WAKE = [0.00, 0.12];      // глаза открываются (два моргания)
  var W_ALARM_IN = [0.05, 0.12];  // сирена включается
  var W_COUNT = [0.12, 0.86];     // таймер бежит
  var W_ALARM_OUT = [0.86, 0.93]; // тревога гаснет
  var W_FLASH = [0.86, 0.99];     // вспышка «код принят»

  // Таймер: 9 минут, останавливается на последних секундах
  var COUNT_FROM = 9 * 60;
  var COUNT_TO = 3;

  // Амплитуды
  var CAM_SCALE = 1.05;        // наезд на Даяну
  var BREATH_SCALE = 0.005;
  var SHAKE = 0.25;            // тряска при тревоге, % от сцены
  var TINT_BASE = 0.40;        // красная тонировка между вспышками сирены
  var TINT_PULSE = 0.35;       // и добавка на пике
  var VIGNETTE_ALARM = 0.85;
  var VIGNETTE_CALM = 0.50;

  var COLOR_ALARM = '#ff3b55';
  var COLOR_OK = '#5dffc8';

  // Утилиты, переносятся в любой pageN.js
  var TWO_PI = Math.PI * 2;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function seg(p, w) { return clamp((p - w[0]) / (w[1] - w[0]), 0, 1); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function wave(t, period) { return Math.sin(t * TWO_PI / period); }

  // Горб 0 → 1 → 0 внутри окна
  function bump(p, w) {
    var s = seg(p, w);
    return s > 0 && s < 1 ? Math.sin(s * Math.PI) : 0;
  }

  // Нерегулярное мерцание 0..1: сумма несоизмеримых синусов
  function flicker(t) {
    var v = wave(t, 173) * 0.5 + wave(t, 461) * 0.3 + wave(t, 1237) * 0.2;
    return clamp(0.5 + v * 0.8, 0, 1);
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Элементы сцены
  var bg = document.getElementById('bg');
  var redtint = document.getElementById('redtint');
  var lamps = document.getElementById('lamps');
  var screens = document.getElementById('screens');
  var hud = document.getElementById('hud');
  var hudPanel = document.getElementById('hud-panel');
  var hudLabel = document.getElementById('hud-label');
  var hudTime = document.getElementById('hud-time');
  var hudOk = document.getElementById('hud-ok');
  var flash = document.getElementById('flash');
  var vignette = document.getElementById('vignette');
  var blackout = document.getElementById('blackout');

  // Текст в SVG меняем только при смене значения — без лишних перерисовок
  function setText(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
  }

  function drawFrame(p, t) {
    var alarm = easeOut(seg(p, W_ALARM_IN)) * (1 - easeInOut(seg(p, W_ALARM_OUT)));
    var solved = p >= W_COUNT[1];
    var calm = easeInOut(seg(p, W_ALARM_OUT));

    // Сирена: острый пик, длинный спад
    var siren = Math.pow((wave(t, SIREN_PERIOD) + 1) / 2, 3);

    // Камера: медленный наезд + тряска в тревоге + дыхание после
    var cam = easeInOut(p);
    var breath = (wave(t, BREATH_PERIOD) + 1) / 2 * calm;
    var scale = mix(1, CAM_SCALE, cam) * (1 + breath * BREATH_SCALE);
    var dx = (wave(t, 97) * 0.6 + wave(t, 233) * 0.4) * SHAKE * alarm * siren;
    var dy = (wave(t, 131) * 0.6 + wave(t, 307) * 0.4) * SHAKE * alarm * siren;
    var camTransform = 'translate(' + dx.toFixed(3) + '%, ' + dy.toFixed(3) + '%) scale(' + scale.toFixed(4) + ')';

    if (bg) bg.style.transform = camTransform;

    if (redtint) {
      redtint.style.transform = camTransform;
      redtint.style.opacity = (alarm * (TINT_BASE + TINT_PULSE * siren)).toFixed(3);
    }

    if (lamps) {
      lamps.style.transform = camTransform;
      lamps.style.opacity = (alarm * siren).toFixed(3);
    }

    // Мониторы рябят во время сбоя и ровно светятся после
    if (screens) {
      screens.style.transform = camTransform;
      screens.style.opacity = (alarm * (0.15 + 0.35 * flicker(t)) + calm * 0.30).toFixed(3);
    }

    // Таймер
    if (hud) {
      hud.style.transform = camTransform;
      hud.style.opacity = (easeOut(seg(p, W_ALARM_IN)) * mix(1, 0.85, calm)).toFixed(3);

      var left = Math.round(mix(COUNT_FROM, COUNT_TO, easeOut(seg(p, W_COUNT))));
      setText(hudTime, pad(Math.floor(left / 60)) + ':' + pad(left % 60));

      var color = solved ? COLOR_OK : COLOR_ALARM;
      if (hudLabel) hudLabel.setAttribute('fill', color);
      if (hudTime) hudTime.setAttribute('fill', color);
      if (hudOk) hudOk.setAttribute('fill', color);
      if (hudPanel) hudPanel.setAttribute('stroke', color);

      setText(hudLabel, solved ? 'КОД ПРИНЯТ' : 'САМОУНИЧТОЖЕНИЕ');
      setText(hudOk, solved ? 'СИСТЕМА ОСТАНОВЛЕНА' : 'ВВЕДИТЕ КОД ДОСТУПА');

      // Цифры мигают в такт сирене, подсказка — вдвое чаще
      if (hudTime) hudTime.style.opacity = solved ? '1' : (0.55 + 0.45 * siren).toFixed(3);
      if (hudOk) hudOk.style.opacity = solved ? '1' : (wave(t, SIREN_PERIOD / 2) > 0 ? '1' : '0.25');
    }

    if (flash) {
      flash.style.transform = camTransform;
      flash.style.opacity = (bump(p, W_FLASH) * 0.75).toFixed(3);
    }

    if (vignette) {
      vignette.style.opacity = (mix(VIGNETTE_CALM, VIGNETTE_ALARM, alarm) * clamp(p * 10, 0, 1)).toFixed(3);
    }

    // Пробуждение: тьма отступает, на середине — моргание
    if (blackout) {
      var w = seg(p, W_WAKE);
      var dark = 1 - easeOut(w) + 0.85 * bump(w, [0.35, 0.55]) + 0.5 * bump(w, [0.65, 0.78]);
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
    // Без JS слои прозрачны — читатель видит картинку как есть
    drawFrame(0, 0);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawFrame(1, 0);
      return;
    }

    var driver = makeTimerDriver();

    requestAnimationFrame(function loop(now) {
      drawFrame(clamp(driver(now), 0, 1), now);
      requestAnimationFrame(loop);
    });
  }

  window.debugFrame = function (p) { drawFrame(clamp(p, 0, 1), performance.now()); };

  init();
});

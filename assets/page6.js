// page6.js — анимация сцены страницы 6: «Двор, ночь → рассвет».
// drawFrame(p, t) рисует кадр сцены для прогресса p из [0, 1] и не знает,
// кто её вызывает. Откуда берётся p — дело драйвера (таймер, гироскоп,
// скролл, мышь). Отладка из консоли: debugFrame(0.5)

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var DURATION = 12000;        // «длительность ночи» при таймере, мс
  var INITIAL_DELAY = 1200;    // пауза перед стартом, мс
  var BREATH_PERIOD = 5200;    // период дыхания девушки, мс
  var GYRO_TIMEOUT = 1500;     // таймаут ожидания данных гироскопа, мс

  // Окна прогресса: что в какой отрезок [0..1] происходит
  var W_SHOES = [0.15, 0.45];  // проявляются шлёпанцы
  var W_DAWN = [0.40, 1.00];   // разгорается заря
  var W_LIFT = [0.62, 1.00];   // девушка распрямляется

  // Амплитуды
  var CAM_SCALE = 1.06;        // наезд камеры на фон
  var CAM_RISE = -1.2;         // подъём фона, % от его высоты
  var GIRL_SCALE = 1.04;       // девушка ближе → растёт сильнее
  var SHOES_SCALE = 1.09;      // ближайший слой → сильнее параллакс
  var LIFT_ANGLE = 0.6;        // «распрямление», град
  var BREATH_RISE = -0.35;     // размах дыхания, % от роста девушки
  var DAWN_MAX = 0.95;         // предельная яркость зари

  // Утилиты, переносятся в любой pageN.js
  var TWO_PI = Math.PI * 2;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }

  // Локальный прогресс 0..1 внутри окна w — чтобы слои включались по очереди
  function seg(p, w) { return clamp((p - w[0]) / (w[1] - w[0]), 0, 1); }

  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // Элементы сцены
  var bg = document.getElementById('bg');
  var dawn = document.getElementById('dawn');
  var girl = document.getElementById('girl');
  var shoes = document.getElementById('shoes');

  // Кадр сцены. p — ход ночи (0 — ночь, 1 — рассвет), t — время в мс для дыхания.
  // transform каждого слоя собирается одной строкой: второе присваивание
  // style.transform затёрло бы первое.
  function drawFrame(p, t) {
    var cam = easeInOut(p);
    var dawnT = easeOut(seg(p, W_DAWN));
    var shoesT = easeOut(seg(p, W_SHOES));
    var liftT = easeInOut(seg(p, W_LIFT));

    var breath = (Math.sin(t * TWO_PI / BREATH_PERIOD) + 1) / 2;   // 0..1

    // Небо и заря — одна глубина, значит один transform на двоих
    var camTransform =
      'translateY(' + mix(0, CAM_RISE, cam).toFixed(3) + '%) ' +
      'scale(' + mix(1, CAM_SCALE, cam).toFixed(4) + ')';

    if (bg) bg.style.transform = camTransform;
    if (dawn) {
      dawn.style.transform = camTransform;
      dawn.style.opacity = (dawnT * DAWN_MAX).toFixed(3);
    }

    if (girl) {
      girl.style.transform =
        'translateY(' + (mix(0, -0.6, cam) + breath * BREATH_RISE).toFixed(3) + '%) ' +
        'rotate(' + mix(0, LIFT_ANGLE, liftT).toFixed(3) + 'deg) ' +
        'scale(' + (mix(1, GIRL_SCALE, cam) * (1 + breath * 0.004)).toFixed(4) + ')';
    }

    if (shoes) {
      shoes.style.opacity = shoesT.toFixed(3);
      shoes.style.transform =
        'translateY(' + mix(2.5, 0, shoesT).toFixed(3) + '%) ' +
        'scale(' + mix(1, SHOES_SCALE, cam).toFixed(4) + ')';
    }
  }

  // Драйверы: функция (now) -> p
  function makeTimerDriver() {
    var start = null;
    return function (now) {
      if (start === null) start = now;
      return (now - start - INITIAL_DELAY) / DURATION;
    };
  }

  var latestGamma = null;
  var lastGyroTime = 0;

  // Наклон телефона = ход ночи. Данные пропали — передаём управление таймеру
  function makeGyroDriver() {
    var fallback = null;
    return function (now) {
      if (now - lastGyroTime > GYRO_TIMEOUT) {
        if (!fallback) fallback = makeTimerDriver();
        return fallback(now);
      }
      return (latestGamma + 90) / 180;
    };
  }

  function handleOrientation(e) {
    if (typeof e.gamma === 'number' && !isNaN(e.gamma)) {
      latestGamma = e.gamma;
      lastGyroTime = performance.now();   // те же часы, что у requestAnimationFrame
    }
  }

  function needsPermissionRequest() {
    return typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function';
  }

  function requestGyroPermission() {
    return new Promise(function (resolve) {
      try {
        DeviceOrientationEvent.requestPermission().then(function (permission) {
          resolve(permission === 'granted');
        }).catch(function () { resolve(false); });
      } catch (err) {
        resolve(false);
      }
    });
  }

  // true, если гироскоп реально прислал данные
  function startGyroscope() {
    return new Promise(function (resolve) {
      function beginListening() {
        var timer = setTimeout(function () {
          window.removeEventListener('deviceorientation', onFirstData, true);
          resolve(false);
        }, GYRO_TIMEOUT);

        function onFirstData(e) {
          handleOrientation(e);
          if (latestGamma !== null) {
            clearTimeout(timer);
            window.removeEventListener('deviceorientation', onFirstData, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
            resolve(true);
          }
        }

        window.addEventListener('deviceorientation', onFirstData, true);
      }

      if (needsPermissionRequest()) {
        requestGyroPermission().then(function (granted) {
          if (granted) { beginListening(); } else { resolve(false); }
        });
      } else {
        beginListening();
      }
    });
  }

  function init() {
    // Стартовое состояние задаём из JS, а не в CSS: сломается скрипт —
    // читатель увидит полную нарисованную сцену
    drawFrame(0, 0);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawFrame(1, 0);
      return;
    }

    startGyroscope().then(function (gyroAvailable) {
      var driver = gyroAvailable ? makeGyroDriver() : makeTimerDriver();

      // Цикл крутится и после конца ночи — дыхание не должно останавливаться
      requestAnimationFrame(function loop(now) {
        drawFrame(clamp(driver(now), 0, 1), now);
        requestAnimationFrame(loop);
      });
    });
  }

  window.debugFrame = function (p) { drawFrame(clamp(p, 0, 1), performance.now()); };

  init();
});

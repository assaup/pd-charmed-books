/* ==========================================================================
   page1.js — анимация сцены страницы 1.
   Параллакс по гироскопу (с фолбэком на таймер), появление следов.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ===== Конфигурация ===== */
  var ANIMATION_DURATION = 9000;  // длительность таймерной анимации, мс
  var INITIAL_DELAY = 1000;       // пауза перед стартом, мс
  var FOOTSTEPS_DELAY = 2000;     // задержка появления следов, мс
  var GYRO_WAIT_TIMEOUT = 1500;   // таймаут ожидания данных гироскопа, мс

  /* ===== Элементы сцены ===== */
  var snowLeft = document.getElementById('snow-left');
  var snowRight = document.getElementById('snow-right');
  var fence = document.getElementById('fence');
  var footsteps = document.getElementById('footsteps');
  var forest = document.getElementById('forest');
  var house = document.getElementById('house');

  /* ===== Состояние гироскопа ===== */
  var latestGamma = null;
  var lastGyroTime = 0;

  /* ===== Утилиты ===== */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function setSceneProgress(progress) {
    var t = easeInOutCubic(progress);
    var scale = 1 + t * 0.3;

    if (snowLeft) snowLeft.style.transform = 'translateX(' + (-t * 30) + '%)';
    if (snowRight) snowRight.style.transform = 'translateX(' + (t * 30) + '%)';
    if (fence) fence.style.transform = 'scale(' + scale + ')';
    if (forest) forest.style.transform = 'scale(' + scale + ')';
    if (house) house.style.transform = 'scale(' + scale + ')';
  }

  function updateFootsteps(progress) {
    if (!footsteps) return;

    var threshold = FOOTSTEPS_DELAY / ANIMATION_DURATION;

    if (progress > threshold) {
      footsteps.classList.add('visible');
      var opacityProgress = (progress - threshold) / (1 - threshold);
      footsteps.style.opacity = Math.min(1, opacityProgress).toFixed(3);
    } else {
      footsteps.style.opacity = '0';
    }
  }

  /* ===== Гироскоп ===== */
  function handleOrientation(e) {
    if (typeof e.gamma === 'number' && !isNaN(e.gamma)) {
      latestGamma = e.gamma;
      lastGyroTime = Date.now();
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
        }).catch(function () {
          resolve(false);
        });
      } catch (err) {
        resolve(false);
      }
    });
  }

  function startGyroscope() {
    return new Promise(function (resolve) {
      function beginListening() {
        var timer = setTimeout(function () {
          // Данных нет — убираем слушатель и идём по таймеру
          window.removeEventListener('deviceorientation', onFirstData, true);
          resolve(false);
        }, GYRO_WAIT_TIMEOUT);

        function onFirstData(e) {
          handleOrientation(e);
          if (latestGamma !== null) {
            clearTimeout(timer);
            window.removeEventListener('deviceorientation', onFirstData, true);
            resolve(true);
          }
        }

        window.addEventListener('deviceorientation', onFirstData, true);
      }

      if (needsPermissionRequest()) {
        requestGyroPermission().then(function (granted) {
          if (granted) {
            beginListening();
          } else {
            resolve(false);
          }
        });
      } else {
        beginListening();
      }
    });
  }

  function animateWithGyroscope() {
    function update() {
      if (Date.now() - lastGyroTime > GYRO_WAIT_TIMEOUT) {
        animateWithTimer();
        return;
      }

      if (latestGamma !== null) {
        var normalized = (latestGamma + 90) / 180;
        var progress = Math.max(0, Math.min(1, normalized));
        setSceneProgress(progress);
        updateFootsteps(progress);
      }
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ===== Таймерный фолбэк ===== */
  function animateWithTimer() {
    var startTime = null;

    function update(currentTime) {
      if (startTime === null) startTime = currentTime;

      var elapsed = currentTime - startTime;
      if (elapsed < INITIAL_DELAY) {
        requestAnimationFrame(update);
        return;
      }

      var progress = Math.min((elapsed - INITIAL_DELAY) / ANIMATION_DURATION, 1);
      setSceneProgress(progress);
      updateFootsteps(progress);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  /* ===== Инициализация ===== */
  function init() {
    if (footsteps) {
      footsteps.style.opacity = '0';
      footsteps.style.transition = 'opacity 0.05s ease';
    }

    startGyroscope().then(function (gyroAvailable) {
      if (gyroAvailable) {
        animateWithGyroscope();
      } else {
        animateWithTimer();
      }
    });
  }

  init();
});

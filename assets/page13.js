// page13.js
// Плавное перемещение большого рекламного баннера снизу вверх.

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var billboard = document.getElementById('billboard');

  if (!billboard) return;

  // Длительность движения
  var DURATION = 5000;

  // Пауза перед началом
  var INITIAL_DELAY = 500;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Плавное движение с замедлением в конце
  function easeInOut(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /*
   * Перемещаем картинку от нижней части к верхней.
   *
   * Важно:
   * картинка намного выше сцены, поэтому мы вычисляем,
   * насколько её нужно поднять, чтобы показать сначала низ,
   * а потом верх.
   */
  function drawFrame(progress) {
    progress = clamp(progress, 0, 1);

    var scene = document.getElementById('scene');

    if (!scene) return;

    var sceneHeight = scene.clientHeight;
    var imageHeight = billboard.offsetHeight;

    // Насколько картинка выше области просмотра
    var distance = imageHeight - sceneHeight;

    // Если картинка не больше сцены — двигать нечего
    if (distance <= 0) {
      billboard.style.transform = 'translateY(0)';
      return;
    }

    var easedProgress = easeInOut(progress);

    /*
     * Начало:
     * translateY(-distance)
     *
     * Показываем нижнюю часть картинки.
     *
     * Конец:
     * translateY(0)
     *
     * Показываем верхнюю часть картинки.
     */
    var y = -distance + distance * easedProgress;

    billboard.style.transform =
      'translateY(' + y.toFixed(2) + 'px)';
  }

  function startAnimation() {
    var startTime = null;

    function animate(now) {
      if (startTime === null) {
        startTime = now;
      }

      var elapsed = now - startTime - INITIAL_DELAY;

      var progress = elapsed / DURATION;

      drawFrame(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        drawFrame(1);
      }
    }

    requestAnimationFrame(animate);
  }

  // Сначала показываем НИЖНЮЮ часть большой картинки
  drawFrame(0);

  // Если пользователь отключил анимации
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    drawFrame(1);
    return;
  }

  startAnimation();

  // Для проверки из консоли:
  // debugFrame(0)   — нижняя часть
  // debugFrame(0.5) — середина
  // debugFrame(1)   — верхняя часть
  window.debugFrame = function (progress) {
    drawFrame(progress);
  };
});
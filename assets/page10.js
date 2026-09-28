/* ==========================================================================
   анимация сцены страницы 10: звонок + вибрации.
   оба эффекта зациклены
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var screenGlow = document.getElementById("screen-glow");

  var buzzlines = [...document.querySelectorAll(".buzz-line")].reverse();
  console.log(buzzlines);

  /* ===== Свечение экрана ===== */
  var GLOW_MAX = 1; // максимальная яркость
  var GLOW_MIN = 0; // минимальная яркость
  var PERIOD = 3200; // период

  var startTime = null;

  function updateGlow(t) {
    if (startTime === null) startTime = t;

    var elapsed = t - startTime;
    var phase = (elapsed / PERIOD) * Math.PI * 2;
    var wave = (Math.sin(phase) + 1) / 2;

    var opacity = GLOW_MIN + wave * (GLOW_MAX - GLOW_MIN);
    screenGlow.style.opacity = opacity.toFixed(3);

    buzzlines.forEach(function (line, index) {
      // небольшая задержка между дугами для "живости"
      var delay = index * 0.05;

      var localWave = (Math.sin(phase - delay * Math.PI * 2) + 1) / 2;

      // делаем быстрее и контрастнее
      var lineOpacity = Math.pow(localWave, 4); // резче вспышка

      line.style.opacity = lineOpacity.toFixed(3);
    });
  }

  /* ===== Цикл ===== */
  function loop(now) {
    if (screenGlow) {
      updateGlow(now);
    }
    requestAnimationFrame(loop);
  }

  function init() {
    // prefers-reduced-motion: свет и точки остаются видимыми, но без
    // мигания — фиксируем на среднем значении.
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      dustState.forEach(function (d) {
        d.el.style.opacity = "0.6";
      });
      return;
    }

    requestAnimationFrame(loop);
  }

  init();
});

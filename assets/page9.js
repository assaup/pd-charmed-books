/* ==========================================================================
   анимация сцены страницы 9: мигающая лампа + пылинки.
   оба эффекта зациклены и не должны заканчиваться
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  var lampGlow = document.getElementById("lamp-glow");
  var dustDots = document.querySelectorAll(".dust-dot");

  /* ===== Мигание лампы ===== */
  var FLICKER_BASE = 0.8; // средняя яркость
  var FLICKER_AMPLITUDE = 0.3; // размах колебаний

  function flickerValue(t) {
    var slow = Math.sin(t / 210);
    var fast = Math.sin(t / 70 + 1.7);
    var mixed = slow * 0.7 + fast * 0.3;
    return FLICKER_BASE + mixed * FLICKER_AMPLITUDE;
  }

  /* ===== Пылинки ===== */
  var DUST_PERIOD = 4000; // мс на полный цикл затухания-разгорания

  // Каждой точке — свой сдвиг фазы, чтобы все
  // не мигали синхронно, как одна лампочка.
  var dustState = [];
  dustDots.forEach(function (dot, i) {
    dustState.push({
      el: dot,
      phase: (i / dustDots.length) * Math.PI * 2,
      period: DUST_PERIOD + (i % 3) * 600,
    });
  });

  function updateDust(t) {
    dustState.forEach(function (d) {
      var wave = (Math.sin((t / d.period) * Math.PI * 2 + d.phase) + 1) / 2; // 0..1
      d.el.style.opacity = (0.25 + wave * 0.85).toFixed(3);
    });
  }

  /* ===== Цикл ===== */
  function loop(now) {
    if (lampGlow) {
      lampGlow.style.opacity = Math.max(
        0,
        Math.min(1, flickerValue(now)),
      ).toFixed(3);
    }
    updateDust(now);
    requestAnimationFrame(loop);
  }

  function init() {
    // prefers-reduced-motion: свет и точки остаются видимыми, но без
    // мигания — фиксируем на среднем значении.
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      if (lampGlow) lampGlow.style.opacity = FLICKER_BASE.toFixed(3);
      dustState.forEach(function (d) {
        d.el.style.opacity = "0.6";
      });
      return;
    }
    requestAnimationFrame(loop);
  }

  init();
});

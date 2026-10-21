// page39.js — анимация сцены страницы 39: побег из рушащейся Spektra.
// Сюжетного финала у сцены нет — бег длится, пока читатель на странице.
// drawFrame(p, t): p из [0, 1] — разгон в первые секунды (тревога
// включается, свет оживает), дальше всё живёт по времени t:
//   — камера покачивается в ритм шагов Даяны;
//   — каждые QUAKE_PERIOD мс здание вздрагивает: тряска, провал света, пыль;
//   — сирена пульсирует в конце коридора, фонари охраны шарят по стенам;
//   — виньетка бьётся как сердце.
// Пыль падает на чистом CSS. Отладка из консоли: debugFrame(0.5)

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var DURATION = 3000;         // разгон сцены, мс
  var INITIAL_DELAY = 400;     // пауза перед стартом, мс
  var STEP_PERIOD = 760;       // полный цикл шагов (левая + правая), мс
  var QUAKE_PERIOD = 4600;     // как часто вздрагивает здание, мс
  var QUAKE_OFFSET = 1800;     // первый толчок — через столько мс после старта
  var QUAKE_DECAY = 380;       // за сколько мс затухает тряска
  var DUST_DECAY = 2200;       // за сколько мс оседает пыль
  var SIREN_PERIOD = 1300;     // период сирены, мс
  var HEART_PERIOD = 820;      // сердцебиение, мс
  var BEAM_A_PERIOD = 3700;    // фонари шарят с разной скоростью
  var BEAM_B_PERIOD = 5300;

  // Амплитуды
  var CAM_SCALE = 1.07;        // запас под тряску, чтобы не было видно краёв
  var BOB_Y = 0.45;            // подпрыгивание на шаге, % от сцены
  var BOB_X = 0.25;            // раскачка влево-вправо
  var QUAKE_SHAKE = 1.1;       // размах тряски при толчке, %
  var QUAKE_DIM = 0.55;        // насколько гаснет свет при толчке
  var BEAM_A = [105, 16];      // угол луча и размах, градусы (0 — вправо, 90 — вниз)
  var BEAM_B = [78, 14];
  var VIGNETTE_BASE = 0.65;
  var VIGNETTE_PULSE = 0.15;

  // Утилиты, переносятся в любой pageN.js
  var TWO_PI = Math.PI * 2;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function wave(t, period) { return Math.sin(t * TWO_PI / period); }

  // Сколько мс прошло с последнего толчка (до первого — бесконечно много)
  function sinceQuake(t) {
    var k = t - QUAKE_OFFSET;
    return k < 0 ? Infinity : k % QUAKE_PERIOD;
  }

  // Элементы сцены
  var bg = document.getElementById('bg');
  var alarm = document.getElementById('alarm');
  var lights = document.getElementById('lights');
  var beams = document.getElementById('beams');
  var beamA = document.getElementById('beam-a');
  var beamB = document.getElementById('beam-b');
  var dust = document.getElementById('dust');
  var dim = document.getElementById('dim');
  var vignette = document.getElementById('vignette');

  // p — разгон, t — время с начала сцены в мс
  function drawFrame(p, t) {
    var on = easeOut(p);

    // Толчок: резкий удар и быстрое затухание
    var dt = sinceQuake(t);
    var quake = Math.exp(-dt / QUAKE_DECAY) * on;
    var dustLevel = Math.exp(-dt / DUST_DECAY) * on;

    // Шаги: вверх-вниз дважды за цикл, вбок — один раз
    var bobY = Math.abs(wave(t, STEP_PERIOD)) * BOB_Y * on;
    var bobX = wave(t, STEP_PERIOD) * BOB_X * on;

    var shakeX = (wave(t, 53) * 0.6 + wave(t, 89) * 0.4) * QUAKE_SHAKE * quake;
    var shakeY = (wave(t, 67) * 0.6 + wave(t, 101) * 0.4) * QUAKE_SHAKE * quake;

    var camTransform =
      'translate(' + (bobX + shakeX).toFixed(3) + '%, ' + (bobY + shakeY).toFixed(3) + '%) ' +
      'scale(' + CAM_SCALE + ')';

    if (bg) bg.style.transform = camTransform;

    var siren = Math.pow((wave(t, SIREN_PERIOD) + 1) / 2, 2);
    if (alarm) {
      alarm.style.transform = camTransform;
      alarm.style.opacity = (on * (0.25 + 0.65 * siren)).toFixed(3);
    }

    // Лампы гаснут в толчок и нервно моргают, пока он не затих
    var stutter = wave(t, 41) > 0 ? 1 : 0.3;
    if (lights) {
      lights.style.transform = camTransform;
      lights.style.opacity = (on * mix(0.75, 0.75 * stutter, clamp(quake * 3, 0, 1)) * (1 - quake)).toFixed(3);
    }

    if (beams) {
      beams.style.transform = camTransform;
      beams.style.opacity = (on * (0.75 - quake * 0.4)).toFixed(3);
    }
    if (beamA) beamA.style.transform = 'rotate(' + (BEAM_A[0] + wave(t, BEAM_A_PERIOD) * BEAM_A[1]).toFixed(2) + 'deg)';
    if (beamB) beamB.style.transform = 'rotate(' + (BEAM_B[0] + wave(t + 900, BEAM_B_PERIOD) * BEAM_B[1]).toFixed(2) + 'deg)';

    if (dust) {
      dust.style.transform = camTransform;
      dust.style.opacity = (dustLevel * 0.95).toFixed(3);
    }

    if (dim) dim.style.opacity = (quake * QUAKE_DIM).toFixed(3);

    // Сердце: короткий удар раз в период
    var beat = Math.pow(Math.max(0, wave(t, HEART_PERIOD)), 8);
    if (vignette) vignette.style.opacity = (on * (VIGNETTE_BASE + VIGNETTE_PULSE * beat + 0.15 * quake)).toFixed(3);
  }

  function init() {
    // Без JS слои прозрачны — читатель видит картинку как есть
    drawFrame(0, 0);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Статичный кадр: свет горит, без тряски и толчков
      drawFrame(1, QUAKE_OFFSET - 1);
      return;
    }

    var start = null;
    requestAnimationFrame(function loop(now) {
      if (start === null) start = now;
      var t = Math.max(0, now - start - INITIAL_DELAY);
      drawFrame(clamp(t / DURATION, 0, 1), t);
      requestAnimationFrame(loop);
    });
  }

  window.debugFrame = function (p) { drawFrame(clamp(p, 0, 1), performance.now()); };

  init();
});

// page43.js — сцена 43: дрожащая рука ставит подпись под соглашением.
// p (0..1) — ход сцены, t — время для дрожи. Отладка: debugFrame(0.5)

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var DURATION = 7000;         // вся сцена, мс
  var INITIAL_DELAY = 200;     // пауза перед стартом, мс

  // Окна прогресса
  var W_MOVE = [0.00, 0.08];   // перо сразу уходит к началу подписи
  var W_WRITE = [0.09, 0.82];  // подпись
  var W_CAM = [0.00, 0.90];    // медленный наезд на подпись

  // Амплитуды
  var NIB_X = 1245;            // кончик пера на картинке, px
  var NIB_Y = 939;
  var LIFT_SCALE = 0.025;      // перо над бумагой — рука чуть ближе
  var LIFT_ARC = 14;           // дуга переноса, px картинки
  var SHADOW_OPACITY = 0.5;    // тень на листе
  var SHADOW_SX = 1.02;        // растяжение от пера: чем дальше от пера, тем выше рука над листом
  var SHADOW_SY = 1.09;
  var SHADOW_LIFT = [-14, 30]; // перо поднято — тень отходит, px картинки
  var SHAKE_HOLD = 0.7;        // лёгкая дрожь до подписи, px картинки
  var SHAKE_WRITE = 0.25;      // во время подписи
  var SHAKE_REST = 0.15;       // после
  var RHYTHM = 0.025;          // неровный темп письма
  var CAM_SCALE = 1.06;
  var VIGNETTE_START = 0.3;
  var VIGNETTE_END = 0.8;

  // Утилиты
  var TWO_PI = Math.PI * 2;
  var PX = 100 / 1920;         // px картинки → % кадра

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function seg(p, w) { return clamp((p - w[0]) / (w[1] - w[0]), 0, 1); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  // 0 → 1 → 0 внутри окна
  function bump(p, w) {
    var s = seg(p, w);
    return s > 0 && s < 1 ? Math.sin(s * Math.PI) : 0;
  }

  // Дрожь: две несоизмеримые частоты
  function shake(t, phase) {
    return Math.sin(t * 0.021 + phase) + 0.6 * Math.sin(t * 0.034 + phase * 2.3);
  }

  // Прогресс подписи: мягкий старт и финиш, рука то ускоряется, то медлит
  function writeAt(p) {
    var s = seg(p, W_WRITE);
    var e = mix(s, smooth(s), 0.5);
    return e + RHYTHM * Math.sin(e * 3 * TWO_PI);
  }

  // Элементы сцены
  var world = document.getElementById('world');
  var hand = document.getElementById('hand');
  var shadow = document.getElementById('hand-shadow');
  var signature = document.getElementById('signature');
  var vignette = document.getElementById('vignette');

  var len = signature ? signature.getTotalLength() : 0;
  var start = signature ? signature.getPointAtLength(0) : { x: NIB_X, y: NIB_Y };
  if (signature) signature.style.strokeDasharray = len + ' ' + len;

  function drawFrame(p, t) {
    var cam = mix(1, CAM_SCALE, easeInOut(seg(p, W_CAM)));
    if (world) world.style.transform = 'scale(' + cam.toFixed(4) + ')';

    // Где сейчас перо
    var nx = NIB_X;
    var ny = NIB_Y;
    var w = writeAt(p);
    var move = easeInOut(seg(p, W_MOVE));
    if (w > 0 && signature) {
      var pt = signature.getPointAtLength(len * w);
      nx = pt.x;
      ny = pt.y;
    } else if (move > 0) {
      nx = mix(NIB_X, start.x, move);
      ny = mix(NIB_Y, start.y, move);
    }
    var lift = bump(p, W_MOVE);
    ny -= lift * LIFT_ARC;

    var amp = mix(SHAKE_HOLD, SHAKE_WRITE, seg(p, [W_MOVE[0], W_WRITE[0]]));
    amp = mix(amp, SHAKE_REST, seg(p, [W_WRITE[1], W_WRITE[1] + 0.08]));
    var dx = nx - NIB_X + shake(t, 0) * amp;
    var dy = ny - NIB_Y + shake(t, 1.7) * amp;

    if (hand) {
      hand.style.transform = 'translate(' + (dx * PX).toFixed(3) + '%, ' + (dy * PX).toFixed(3) + '%) scale(' + (1 + lift * LIFT_SCALE).toFixed(4) + ')';
    }

    // Тень: у пера касается листа, при подъёме отходит и бледнеет
    if (shadow) {
      var sx = (dx + lift * SHADOW_LIFT[0]) * PX;
      var sy = (dy + lift * SHADOW_LIFT[1] + lift * LIFT_ARC) * PX;
      shadow.style.transform = 'translate(' + sx.toFixed(3) + '%, ' + sy.toFixed(3) + '%) scale(' + SHADOW_SX + ', ' + SHADOW_SY + ')';
      shadow.style.opacity = (SHADOW_OPACITY * (1 - 0.35 * lift)).toFixed(3);
    }

    // Чернила идут ровно за пером
    if (signature) {
      signature.style.strokeDashoffset = (len * (1 - w)).toFixed(2);
      signature.style.visibility = w > 0 ? '' : 'hidden';
    }

    if (vignette) vignette.style.opacity = mix(VIGNETTE_START, VIGNETTE_END, smooth(p)).toFixed(3);
  }

  function makeTimerDriver() {
    var begin = null;
    return function (now) {
      if (begin === null) begin = now;
      return (now - begin - INITIAL_DELAY) / DURATION;
    };
  }

  function init() {
    drawFrame(0, 0);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawFrame(1, 0);
      return;
    }

    var driver = makeTimerDriver();

    // Цикл идёт и после финала — ради дрожи
    requestAnimationFrame(function loop(now) {
      if (!paused) drawFrame(clamp(driver(now), 0, 1), now);
      requestAnimationFrame(loop);
    });
  }

  // debugFrame останавливает цикл, debugFrame() — продолжить
  var paused = false;
  window.debugFrame = function (p) {
    paused = p !== undefined;
    if (paused) drawFrame(clamp(p, 0, 1), performance.now());
  };

  init();
});

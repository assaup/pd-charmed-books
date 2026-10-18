// page42.js — сцена 42: ночная улица, она бредёт прочь в тумане.
// p (0..1) — ход сцены, t — время для фонаря, ветра и пульса. Отладка: debugFrame(0.5)

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var DURATION = 24000;        // вся сцена, мс
  var INITIAL_DELAY = 400;     // пауза перед стартом, мс
  var BREATH_PERIOD = 7000;    // дыхание камеры, мс
  var BEAT_PERIOD = 1050;      // сердцебиение в гневе, мс

  // Окна прогресса
  var W_OPEN = [0.00, 0.07];   // выход из темноты
  var W_WALK = [0.00, 0.98];   // бредёт, шаркая
  var W_WIND = [0.12, 0.42];   // порыв тёплого ветра
  var W_STORM = [0.42, 0.74];  // ураган внутри
  var W_FOG = [0.66, 1.00];    // вязкий туман у лодыжек

  // Амплитуды
  var CAM_START = 1.18;        // начало — крупно на девушке
  var BREATH_SCALE = 0.004;
  var BEAT_SCALE = 0.007;
  var HORIZON_Y = 1234;        // линия горизонта, px картинки
  var FEET_Y = 1461;           // ступни на исходной картинке
  var FEET_END = 1390;         // где останавливается
  var WALK_STEPS = 16;
  var LIFT = 1.1;              // подъём ступни, % высоты фигуры
  var BOB = 0.07;              // покачивание корпуса, % кадра
  var SWAY_DEG = 0.5;
  var GLOW_MAX = 0.75;         // как opacity у .glow в 42.css
  var PETAL_SPEED = 1.6;       // % ленты в секунду без порыва
  var GUST_SHIFT = 140;        // доп. сдвиг за порыв, % ленты
  var FOG_MAX = 0.9;
  var RAGE_MAX = 0.75;
  var VIGNETTE_START = 0.45;
  var VIGNETTE_END = 0.85;

  // Утилиты
  var TWO_PI = Math.PI * 2;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function seg(p, w) { return clamp((p - w[0]) / (w[1] - w[0]), 0, 1); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function wave(t, period) { return Math.sin(t * TWO_PI / period); }

  // 0 → 1 → 0 внутри окна
  function bump(p, w) {
    var s = seg(p, w);
    return s > 0 && s < 1 ? Math.sin(s * Math.PI) : 0;
  }

  // Детерминированный шум 0..1
  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // Неисправный фонарь: серия провалов раз в несколько секунд
  function faulty(t) {
    var k = t % 4300;
    if (k < 70) return 0.12;
    if (k < 130) return 1;
    if (k < 260) return 0.08;
    if (k < 300) return 0.9;
    if (k < 520) return 0.3 + 0.2 * hash(Math.floor(t / 40));
    return 0.94 + 0.06 * hash(Math.floor(t / 90));
  }

  // Двойной удар сердца 0..1
  function heartbeat(t) {
    var k = (t % BEAT_PERIOD) / BEAT_PERIOD;
    return Math.exp(-k * 18) + 0.6 * Math.exp(-Math.abs(k - 0.28) * 22) * (k > 0.24 ? 1 : 0.4);
  }

  // Ход: сразу в шаге, к концу замедляется и встаёт
  function walkAt(p) {
    return Math.sin(seg(p, W_WALK) * Math.PI / 2);
  }

  // Элементы сцены
  var world = document.getElementById('world');
  var walk = document.getElementById('walk');
  var legsL = document.querySelectorAll('.leg-l');
  var legsR = document.querySelectorAll('.leg-r');
  var fog = document.getElementById('fog');
  var petals = document.getElementById('petals');
  var petalsFar = document.getElementById('petals-far');
  var petalsNear = document.getElementById('petals-near');
  var rage = document.getElementById('rage');
  var vignette = document.getElementById('vignette');
  var blackout = document.getElementById('blackout');

  var shade = document.getElementById('shade-r2');
  var glow = document.getElementById('glow-r2');

  // Мигает только один фонарь, остальные горят ровно (42.css)
  function drawLamp(t) {
    var v = faulty(t);
    if (shade) shade.style.opacity = (1 - v).toFixed(3);
    if (glow) glow.style.opacity = (GLOW_MAX * v).toFixed(3);
  }

  function drawWalker(p) {
    var w = walkAt(p);
    var fy = mix(FEET_Y, FEET_END, w);
    var s = (fy - HORIZON_Y) / (FEET_Y - HORIZON_Y);
    var dy = (fy - FEET_Y) / 19.2;

    // Фаза шага привязана к пройденному пути — ступни не скользят
    var sw = Math.sin(w * WALK_STEPS * Math.PI);
    var bob = Math.abs(sw) * BOB * s;

    if (walk) {
      walk.style.transform = 'translate(0, ' + (dy - bob).toFixed(3) + '%) scale(' + s.toFixed(4) + ') rotate(' + (sw * SWAY_DEG).toFixed(3) + 'deg)';
    }

    // Ступня поднимается плавно, без рывка от земли
    var l = 'translateY(' + (-Math.pow(Math.max(0, sw), 1.6) * LIFT).toFixed(2) + '%)';
    var r = 'translateY(' + (-Math.pow(Math.max(0, -sw), 1.6) * LIFT).toFixed(2) + '%)';
    for (var i = 0; i < legsL.length; i++) legsL[i].style.transform = l;
    for (var j = 0; j < legsR.length; j++) legsR[j].style.transform = r;
  }

  function drawFrame(p, t) {
    var open = easeOut(seg(p, W_OPEN));
    var storm = bump(p, W_STORM);
    var hb = heartbeat(t);
    var breath = (wave(t, BREATH_PERIOD) + 1) / 2;

    // Камера: от крупного плана к пустой улице
    var scale = mix(CAM_START, 1, easeInOut(p)) * (1 + breath * BREATH_SCALE + storm * hb * BEAT_SCALE);
    if (world) world.style.transform = 'scale(' + scale.toFixed(4) + ')';

    drawLamp(t);
    drawWalker(p);

    // Лепестки: базовый дрейф + порыв ветра
    if (petals) {
      var gust = smooth(seg(p, W_WIND));
      var off = t / 1000 * PETAL_SPEED + gust * GUST_SHIFT;
      var bobY = wave(t, 5200) * 1.2 + bump(p, W_WIND) * 3;
      petals.style.opacity = (seg(p, [0.08, 0.16]) * mix(1, 0.45, seg(p, [W_WIND[1], W_WIND[1] + 0.1]))).toFixed(3);
      if (petalsNear) petalsNear.style.transform = 'translate(' + (-(off % 50)).toFixed(3) + '%, ' + bobY.toFixed(2) + '%)';
      if (petalsFar) petalsFar.style.transform = 'translate(' + (-((off * 0.55 + 17) % 50)).toFixed(3) + '%, ' + (-bobY * 0.6).toFixed(2) + '%)';
    }

    if (fog) fog.style.opacity = (mix(0.2, 1, smooth(seg(p, W_FOG))) * FOG_MAX * open).toFixed(3);

    if (rage) rage.style.opacity = (storm * (0.25 + 0.75 * hb) * RAGE_MAX).toFixed(3);

    if (vignette) vignette.style.opacity = mix(VIGNETTE_START, VIGNETTE_END, smooth(p)).toFixed(3);

    if (blackout) blackout.style.opacity = (1 - open).toFixed(3);
  }

  function makeTimerDriver() {
    var start = null;
    return function (now) {
      if (start === null) start = now;
      return (now - start - INITIAL_DELAY) / DURATION;
    };
  }

  function init() {
    drawFrame(0, 0);

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawFrame(1, 1000);
      return;
    }

    var driver = makeTimerDriver();

    // Цикл идёт и после финала — ради фонаря, ветра и тумана
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

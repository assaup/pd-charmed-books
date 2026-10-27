// page16.js — музыка страницы 16.
// Трек играет, пока читатель не дошёл до первого блока .quiz: со старта
// страницы громкость плавно нарастает, а как только квиз показался на экране
// (или остался выше) — плавно затихает и встаёт на паузу. Прокрутил обратно
// выше квиза — снова нарастает с того же места. Переключил вкладку — пауза.
// Браузер не даёт включить звук без клика: тогда показываем кнопку
// «Включить музыку» и заодно ждём любого клика или нажатия клавиши.
// Отладка из консоли: debugMusic(true) / debugMusic(false)

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Конфигурация
  var MAX_VOLUME = 0.6;               // громкость после нарастания, 0…1
  var FADE_IN = 2500;                 // нарастание, мс
  var FADE_OUT = 2000;                // затухание, мс

  var music = document.getElementById('music');
  var btn = document.getElementById('music-btn');
  var trigger = document.querySelector('#textbox .quiz');   // первый квиз
  if (!music || !trigger) return;

  var inZone = false;                 // квиз ещё ниже экрана
  var fadeTimer = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Плавно ведёт громкость к target за duration мс (кривая ease-in-out).
  // done вызывается, когда громкость дошла до цели.
  // Таймер, а не requestAnimationFrame: rAF в фоновой вкладке замирает,
  // и затухание никогда бы не закончилось
  function fadeTo(target, duration, done) {
    clearInterval(fadeTimer);
    var from = music.volume;
    var start = Date.now();

    fadeTimer = setInterval(function () {
      var t = clamp((Date.now() - start) / duration, 0, 1);
      var k = t * t * (3 - 2 * t);
      music.volume = clamp(from + (target - from) * k, 0, 1);
      if (t >= 1) {
        clearInterval(fadeTimer);
        if (done) done();
      }
    }, 30);
  }

  function shouldPlay() {
    return inZone && !document.hidden;
  }

  function fadeIn() {
    if (music.paused) music.volume = 0;

    var played = music.play();
    if (played && played.catch) {
      played.then(function () {
        btn.hidden = true;
        // Пока запускалось, читатель мог уже долистать до квиза
        if (shouldPlay()) fadeTo(MAX_VOLUME, FADE_IN);
        else fadeOut();
      }).catch(function () {
        // Автозапуск запрещён — ждём действия пользователя
        btn.hidden = false;
      });
    } else {
      fadeTo(MAX_VOLUME, FADE_IN);
    }
  }

  function fadeOut() {
    btn.hidden = true;
    if (music.paused) return;
    fadeTo(0, FADE_OUT, function () { music.pause(); });
  }

  function update() {
    if (shouldPlay()) {
      fadeIn();
    } else if (document.hidden) {
      // Вкладку уже не видно — плавность никто не услышит, выключаем сразу
      clearInterval(fadeTimer);
      music.pause();
    } else {
      fadeOut();
    }
  }

  // ---------- Когда включать ----------

  // «В зоне» — квиз ещё не показался: он целиком ниже нижнего края экрана.
  // root не задан: наблюдатель сам учитывает прокрутку внутри #content / main
  var observer = new IntersectionObserver(function (entries) {
    var entry = entries[0];
    var bottom = entry.rootBounds ? entry.rootBounds.bottom : window.innerHeight;
    var next = !entry.isIntersecting && entry.boundingClientRect.top >= bottom;
    if (next !== inZone) {
      inZone = next;
      update();
    }
  });
  observer.observe(trigger);

  document.addEventListener('visibilitychange', update);

  // Первый клик/клавиша после запрета автозапуска — пробуем ещё раз
  function retry() {
    if (shouldPlay() && music.paused) fadeIn();
  }
  document.addEventListener('pointerdown', retry);
  document.addEventListener('keydown', retry);
  btn.addEventListener('click', retry);

  window.debugMusic = function (on) {
    inZone = !!on;
    update();
  };
});

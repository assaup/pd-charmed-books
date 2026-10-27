// page12.js — музыка страницы 12.
// Трек играет, только пока на экране виден хотя бы один из двух последних
// блоков .quiz: появился — громкость плавно нарастает, ушёл с экрана
// (или читатель переключил вкладку) — плавно затихает и встаёт на паузу.
// Следующее появление продолжает трек с того же места.
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
  var quizzes = document.querySelectorAll('#textbox .quiz');
  if (!music || quizzes.length < 2) return;

  // Два последних квиза
  var triggers = [quizzes[quizzes.length - 2], quizzes[quizzes.length - 1]];

  var visible = [];                   // какие из triggers сейчас на экране
  var inZone = false;                 // виден хотя бы один
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
        // Пока запускалось, квиз мог уже уйти с экрана
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

  // root не задан: наблюдатель сам учитывает прокрутку внутри #content / main
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      visible[triggers.indexOf(entry.target)] = entry.isIntersecting;
    });
    var next = visible[0] === true || visible[1] === true;
    if (next !== inZone) {
      inZone = next;
      update();
    }
  });
  triggers.forEach(function (el) { observer.observe(el); });

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

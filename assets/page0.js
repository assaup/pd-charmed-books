// page0.js — интерактив страницы 0 «Пролог».
// Кнопка «Удалить» одноразово открывает продолжение текста: старый блок
// плавно гаснет, новый — плавно проявляется. Анимация «осколков кода» —
// целиком на CSS (0.css), сюда её логика не попадает.

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var button = document.getElementById('delete-btn');
  var before = document.getElementById('prologue-before');
  var after = document.getElementById('prologue-after');

  if (!button || !before || !after) return;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealAfter() {
    button.disabled = true;

    after.hidden = false;
    // hidden снят только что — форсируем расчёт стилей, иначе браузер
    // схлопнёт переход opacity 0 -> 1 в один кадр без анимации
    void after.offsetWidth;
    after.classList.add('is-showing');

    before.classList.add('is-hiding');

    var finish = function () {
      before.hidden = true;
      after.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };

    if (reduceMotion) {
      finish();
    } else {
      before.addEventListener('transitionend', finish, { once: true });
    }
  }

  button.addEventListener('click', revealAfter);
});

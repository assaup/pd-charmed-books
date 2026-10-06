// quiz.js — кликабельные варианты в блоках .quiz.
// Клик (или Enter/Пробел) по варианту выделяет его и снимает выделение
// с остальных вариантов того же блока; повторный клик снимает выбор.
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  document.querySelectorAll('#textbox .quiz').forEach(function (quiz) {
    var items = quiz.querySelectorAll('li');

    function select(item) {
      var wasSelected = item.classList.contains('is-selected');
      items.forEach(function (li) {
        li.classList.remove('is-selected');
        li.setAttribute('aria-checked', 'false');
      });
      if (!wasSelected) {
        item.classList.add('is-selected');
        item.setAttribute('aria-checked', 'true');
      }
    }

    quiz.querySelector('ul').setAttribute('role', 'radiogroup');
    items.forEach(function (item) {
      item.setAttribute('role', 'radio');
      item.setAttribute('aria-checked', 'false');
      item.tabIndex = 0;
      item.addEventListener('click', function () { select(item); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(item); }
      });
    });
  });
});

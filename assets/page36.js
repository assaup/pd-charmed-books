// page36.js — сцена страницы 36: голографический шлем и луч данных.
// Вся анимация — CSS-keyframes в 36.css. Скрипт только запускает её,
// когда страница загрузилась и лоадер убран.

window.addEventListener('load', function () {
  'use strict';

  var scene = document.getElementById('scene');
  if (scene) scene.classList.add('is-running');
});
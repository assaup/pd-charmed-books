
// page41.js — сцена страницы 41: скандал: вспышки крика, давление, тающий силуэт.
// Вся анимация — CSS-keyframes в 41.css. Скрипт только запускает её,
// когда страница загрузилась и лоадер убран.

window.addEventListener('load', function () {
  'use strict';

  var scene = document.getElementById('scene');
  if (scene) scene.classList.add('is-running');
});
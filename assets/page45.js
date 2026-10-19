// page45.js — сцена страницы 45: силуэт за спиной проявляется, экран мерцает.
// Вся анимация — CSS-keyframes в 45.css. Скрипт только запускает её,
// когда страница загрузилась и лоадер убран.

window.addEventListener('load', function () {
  'use strict';

  var scene = document.getElementById('scene');
  if (scene) scene.classList.add('is-running');
});
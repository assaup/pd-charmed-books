// page44.js — сцена страницы 44: сбоящие воспоминания и музыка.
// Вся анимация — CSS-keyframes в 44.css. Скрипт только запускает её,
// когда страница загрузилась и лоадер убран.

window.addEventListener('load', function () {
  'use strict';

  var scene = document.getElementById('scene');
  if (scene) scene.classList.add('is-running');
});
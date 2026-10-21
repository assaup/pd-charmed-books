// page35.js — сцена страницы 35: мерцающая, сбоящая голограмма.
// Вся анимация — CSS-keyframes в 35.css. Скрипт только запускает её,
// когда страница загрузилась и лоадер убран.

window.addEventListener('load', function () {
  'use strict';

  var scene = document.getElementById('scene');
  if (scene) scene.classList.add('is-running');
});
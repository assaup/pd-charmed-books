// page34.js — сцена страницы 34: кардиограмма и наушники «в такт сердцу».
// Вся анимация — CSS-keyframes в 34.css. Скрипт только запускает её,
// когда страница загрузилась и лоадер убран.

window.addEventListener('load', function () {
  'use strict';

  var scene = document.getElementById('scene');
  if (scene) scene.classList.add('is-running');
});
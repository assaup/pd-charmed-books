// page8.js — голосовой ввод страницы 8.
// Читатель говорит вслух «Кто ты такой?» — открывается вторая часть текста
// (#part-2), а неон на сцене вспыхивает (класс .is-awake, стили — в 8.css).
// Распознавание — встроенный Web Speech API (Chrome, Edge, Safari).
// Нет API или доступа к микрофону — показываем поле, куда фразу можно напечатать.
// Отладка из консоли: debugReveal()

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Фраза-ключ: «кто ты такой», допускается «кто ты вообще такой»
  var PHRASE = /кто ты (вообще )?такой/;

  // Элементы
  var voice = document.getElementById('voice');
  var btn = document.getElementById('voice-btn');
  var label = document.getElementById('voice-btn-label');
  var status = document.getElementById('voice-status');
  var form = document.getElementById('voice-form');
  var input = document.getElementById('voice-input');
  var part2 = document.getElementById('part-2');
  var scene = document.getElementById('scene');

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = null;
  var listening = false;
  var revealed = false;

  // «Кто ты, такой?!» → «кто ты такой»
  function normalize(text) {
    return text.toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^а-яa-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function matches(text) {
    return PHRASE.test(normalize(text));
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    stopListening();

    voice.hidden = true;
    part2.hidden = false;

    // Перезапуск класса, чтобы вспышка сработала даже повторно
    scene.classList.remove('is-awake');
    void scene.offsetWidth;
    scene.classList.add('is-awake');

    part2.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showFallback(message) {
    status.textContent = message;
    form.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (matches(input.value)) {
      reveal();
    } else {
      status.textContent = 'Он ждёт другого вопроса. Напишите: «Кто ты такой?»';
    }
  });

  // ---------- Микрофон ----------

  function setListening(on) {
    listening = on;
    btn.classList.toggle('is-listening', on);
    label.textContent = on ? 'Слушаю… (нажмите, чтобы выключить)' : 'Включить микрофон';
  }

  function startListening() {
    setListening(true);
    status.textContent = 'Говорите…';
    try { recognition.start(); } catch (e) { /* уже запущено */ }
  }

  function stopListening() {
    if (!listening) return;
    setListening(false);
    recognition.stop();
  }

  if (!SR) {
    btn.hidden = true;
    showFallback('Ваш браузер не распознаёт речь. Напишите вопрос:');
  } else {
    recognition = new SR();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;      // не останавливаться после первой фразы
    recognition.interimResults = true;  // ловить фразу, не дожидаясь паузы

    recognition.onresult = function (e) {
      // Фраза может прийти частями («кто ты» + «такой»), поэтому склеиваем всё
      var text = '';
      for (var i = 0; i < e.results.length; i++) {
        text += ' ' + e.results[i][0].transcript;
      }
      status.textContent = '«' + text.trim() + '»';
      if (matches(text)) reveal();
    };

    recognition.onerror = function (e) {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setListening(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        showFallback('Нет доступа к микрофону. Напишите вопрос:');
      } else if (e.error === 'network') {
        showFallback('Распознавание речи не работает без интернета. Напишите вопрос:');
      } else {
        showFallback('Микрофон не сработал. Напишите вопрос:');
      }
    };

    // Браузер сам обрывает распознавание после тишины — перезапускаем
    recognition.onend = function () {
      if (listening && !revealed) {
        try { recognition.start(); } catch (e) { setListening(false); }
      }
    };

    btn.addEventListener('click', function () {
      if (listening) {
        stopListening();
        status.textContent = '';
      } else {
        startListening();
      }
    });
  }

  window.debugReveal = reveal;
});

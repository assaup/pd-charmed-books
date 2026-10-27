(function () {
  const wrapper = document.querySelector(".glitch__wrapper");
  const original = wrapper.querySelector(".glitch");

  let items = []; // массив клонов
  let offset = 0; // накопленный сдвиг вверх
  const speed = 1.5; // пикселей за кадр

  function build() {
    // очищаем всё, кроме оригинала
    items.forEach((el) => el.remove());
    items = [];

    // ждём загрузки картинки, чтобы знать её реальную высоту
    const init = () => {
      const h = original.offsetHeight;
      if (!h) return; // картинка ещё не загрузилась

      // сколько копий нужно, чтобы заполнить окно + 1 запасная
      const needed = Math.ceil(wrapper.offsetHeight / h) + 1;

      // ставим оригинал первым
      original.style.top = "0px";
      items.push(original);

      for (let i = 1; i < needed; i++) {
        const clone = original.cloneNode(true);
        clone.style.top = `${i * h}px`;
        wrapper.appendChild(clone);
        items.push(clone);
      }

      offset = 0;
    };

    if (original.complete) init();
    else original.addEventListener("load", init, { once: true });
  }

  function tick() {
    if (!items.length) return;

    offset += speed;
    const h = items[0].offsetHeight;

    // двигаем все картинки вверх через top
    items.forEach((el) => {
      el.style.top = `${parseFloat(el.style.top) - speed}px`;
    });

    // если первая ушла выше верхнего края — переносим её в конец
    if (parseFloat(items[0].style.top) <= -h) {
      const first = items.shift();
      const lastTop = parseFloat(items[items.length - 1].style.top);
      first.style.top = `${lastTop + h}px`;
      items.push(first);
    }

    requestAnimationFrame(tick);
  }

  // пересборка при изменении размера окна
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 150);
  });

  build();
  requestAnimationFrame(tick);
})();

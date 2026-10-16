const canvas = document.getElementById("dust");
const ctx = canvas.getContext("2d");

const image = new Image();
image.src = "./assets/img/page-15/dots.png";

let particles = [];
let width = 0;
let height = 0;

image.onload = () => {
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  width = canvas.width;
  height = canvas.height;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;

  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(image, 0, 0);

  const pixels = tempCtx.getImageData(0, 0, width, height).data;

  // Находим все бирюзовые точки
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;

      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      if (g > 130 && b > 150 && r < 100) {
        particles.push({
          x,
          y,
          size: Math.random() * 1.5 + 1,

          // Начальная позиция
          baseX: x,
          baseY: y,

          // Радиус небольшого движения
          driftX: 2 + Math.random() * 12,
          driftY: 2 + Math.random() * 12,

          // У каждой частицы свой ритм
          phase: Math.random() * Math.PI * 7,
          speed: 0.003 + Math.random() * 0.012,

          // Разная яркость
          brightness: 0.1 + Math.random() * 0.7,

          // Индивидуальная скорость мерцания
          flickerSpeed: Math.random() * 0.04,
          flickerPhase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  console.log("Частиц создано:", particles.length);
  animate();
};

image.onerror = () => {
  console.error("Не удалось загрузить dots.png");
};

function animate() {
  ctx.clearRect(0, 0, width, height);

  for (const p of particles) {
    p.phase += p.speed;
    p.flickerPhase += p.flickerSpeed;

    // Плавное хаотичное движение вокруг исходной точки
    const x =
      p.baseX + Math.sin(p.phase) * p.driftX + Math.sin(p.phase * 0.43) * 3;

    const y =
      p.baseY +
      Math.cos(p.phase * 0.8) * p.driftY +
      Math.sin(p.phase * 0.6) * 3;

    // Независимое мерцание каждой частицы
    const wave = (Math.sin(p.flickerPhase) + 1) / 2;

    // Часть частиц периодически почти исчезает
    const opacity = p.brightness * Math.pow(wave, 3);

    if (opacity < 0.04) {
      continue;
    }

    ctx.globalAlpha = opacity;
    ctx.fillStyle = "#20eaff";

    // Мягкое бирюзовое свечение
    ctx.shadowColor = "#20eaff";
    ctx.shadowBlur = 4;

    ctx.fillRect(x, y, p.size, p.size);
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  requestAnimationFrame(animate);
}

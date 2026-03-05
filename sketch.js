// --- Textures (posa aquí els teus 5-6 JPGs a /assets) ---
const TEXTURE_PATHS = [
  "assets/step01.jpg",
  "assets/step03.jpg",
  "assets/step04.jpg",
  "assets/step05.jpg",
  "assets/step06.jpg",
  "assets/step07.jpg",
  "assets/step08.jpg",
  "assets/step02.jpg",
];

let textures = [];
let currentIndex = 0;

// Textura activa + transició
let currentTex = null;
let fromTex = null;
let toTex = null;
let isFading = false;
let fadeStart = 0;
const FADE_MS = 550; // durada del fade

// Rotació només horitzontal
let rotY = 0;
let velY = 0;

// Auto-spin constant (suau)
const AUTO_SPIN = 0.0022; // puja/baixa al gust (0.0015–0.004)

// Camera fixa (sense zoom)
const CAM_DIST = 900;

// Mida esfera
const SPHERE_RADIUS = 260; // posa 220–280 si la vols més gran

function preload() {
  textures = TEXTURE_PATHS.map((p) =>
    loadImage(p, () => {}, () => console.warn("No s'ha pogut carregar:", p))
  );
}

function setup() {
  const holder = document.getElementById("canvas-holder");
  const w = holder.offsetWidth;   // 1100
  const h = holder.offsetHeight;  // 800

  const c = createCanvas(w, h, WEBGL);
  c.parent("canvas-holder");
  pixelDensity(Math.min(2, window.devicePixelRatio || 1));

  currentTex = firstValidTexture() || null;

  document.getElementById("nextStepBtn").addEventListener("click", nextStep);

  // Wheel: NO scroll de pàgina, i SÍ rotació
  window.addEventListener("wheel", onWheel, { passive: false });

  // (Opcional) teclat
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowRight") nextStep();
  });
}

function draw() {
  background(0);

  // Camera fixa mirant al centre
  camera(0, 0, CAM_DIST, 0, 0, 0, 0, 1, 0);

  // Llums
  ambientLight(70);
  directionalLight(255, 255, 255, 0.35, 0.25, -1);
  pointLight(120, 120, 120, 0, 0, 350);

  // Auto-rotació + inèrcia de scroll
  velY *= 0.92;
  rotY += velY;
  rotY += AUTO_SPIN;

  // Només gir horitzontal
  rotateY(rotY);

  noStroke();

  // --- Render amb fade entre textures ---
  if (isFading && fromTex && toTex) {
    const t = fadeProgress();

    // Per evitar z-fighting entre dues esferes al mateix lloc:
    // dibuixem dues esferes amb un radi quasi igual (0.6 px de diferència)
    drawTexturedSphere(fromTex, 1 - t, SPHERE_RADIUS);
    drawTexturedSphere(toTex, t, SPHERE_RADIUS + 0.6);

    if (t >= 1) {
      currentTex = toTex;
      isFading = false;
      fromTex = null;
      toTex = null;
    }
  } else {
    if (currentTex) {
      texture(currentTex);
    } else {
      normalMaterial();
    }
    sphere(SPHERE_RADIUS, 64, 64);
  }
}

function drawTexturedSphere(img, alpha01, r) {
  push();
  // tint funciona amb textures en p5 WEBGL (alpha 0–255)
  tint(255, Math.floor(constrain(alpha01, 0, 1) * 255));
  texture(img);
  sphere(r, 64, 64);
  pop();
}

// Scroll = girar esquerra/dreta
function onWheel(e) {
  e.preventDefault();

  const k = 0.0018;           // sensibilitat
  rotY += e.deltaY * k;
  velY = e.deltaY * k * 0.45; // inèrcia
}

// Next step = canviar textura amb fade
function nextStep() {
  if (!textures.length) return;

  // Troba la següent textura vàlida
  let nextIndex = (currentIndex + 1) % textures.length;
  let guard = 0;
  while (!textures[nextIndex] && guard < textures.length) {
    nextIndex = (nextIndex + 1) % textures.length;
    guard++;
  }

  const nextTex = textures[nextIndex];
  if (!nextTex) return;

  currentIndex = nextIndex;

  // Inicia fade
  fromTex = currentTex || nextTex;
  toTex = nextTex;
  fadeStart = millis();
  isFading = true;
}

function fadeProgress() {
  const elapsed = millis() - fadeStart;
  const t = constrain(elapsed / FADE_MS, 0, 1);
  // easing suau (smoothstep)
  return t * t * (3 - 2 * t);
}

function firstValidTexture() {
  for (const t of textures) if (t) return t;
  return null;
}
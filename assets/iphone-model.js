import * as THREE from './vendor/three.module.js?v=2';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js?v=2';

const stage = document.getElementById('phoneStage');
const canvas = document.getElementById('phoneCanvas');
if (!stage || !canvas) throw new Error('Área do modelo 3D não encontrada.');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 40);
camera.position.set(0, 0.06, 5.8);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
} catch (error) {
  console.warn('Modelo 3D indisponível; mantendo imagem estática.', error);
}

if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;

  scene.add(new THREE.HemisphereLight(0xf5f7ff, 0x3a414e, 2.15));
  const key = new THREE.DirectionalLight(0xffffff, 3.4);
  key.position.set(-3.2, 4.5, 5.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa7c6ff, 3.1);
  rim.position.set(3.8, 1.5, -4.5);
  scene.add(rim);
  const warmEdge = new THREE.PointLight(0xffd4a1, 2.2, 9);
  warmEdge.position.set(-3.4, -2.1, -1.8);
  scene.add(warmEdge);

  const phone = new THREE.Group();
  scene.add(phone);
  const metal = new THREE.MeshPhysicalMaterial({ color: 0x292b30, metalness: 0.96, roughness: 0.2, clearcoat: 0.65, clearcoatRoughness: 0.18 });
  const blackGlass = new THREE.MeshPhysicalMaterial({ color: 0x080a0f, metalness: 0.35, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 });
  const rearFinish = new THREE.MeshPhysicalMaterial({ color: 0x1a1b1e, metalness: 0.08, roughness: 0.3, clearcoat: 0.14, clearcoatRoughness: 0.34 });
  const screenMaterial = new THREE.MeshPhysicalMaterial({ map: makeScreenTexture(), metalness: 0.12, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.18, 2.48, 0.145, 8, 0.105), metal);
  phone.add(body);

  const front = new THREE.Mesh(new RoundedBoxGeometry(1.105, 2.385, 0.014, 8, 0.085), screenMaterial);
  front.position.z = 0.077;
  phone.add(front);
  const rearGlass = new THREE.Mesh(new RoundedBoxGeometry(1.105, 2.385, 0.014, 8, 0.085), rearFinish);
  rearGlass.position.z = -0.077;
  rearGlass.rotation.y = Math.PI;
  phone.add(rearGlass);

  const island = new THREE.Mesh(new RoundedBoxGeometry(0.39, 0.115, 0.018, 6, 0.055), new THREE.MeshPhysicalMaterial({ color: 0x020305, roughness: 0.2, metalness: 0.2, clearcoat: 1 }));
  island.position.set(0, 1.105, 0.091);
  phone.add(island);
  const selfieLens = new THREE.Mesh(new THREE.CircleGeometry(0.025, 32), new THREE.MeshBasicMaterial({ color: 0x193556 }));
  selfieLens.position.set(0.125, 1.105, 0.102);
  phone.add(selfieLens);

  addSideButton(phone, -0.604, 0.64, 0.08, 0.34, metal);
  addSideButton(phone, -0.604, 0.20, 0.08, 0.25, metal);
  addSideButton(phone, -0.604, -0.12, 0.08, 0.25, metal);
  addSideButton(phone, 0.604, 0.48, 0.08, 0.48, metal);
  addSideButton(phone, 0, -1.225, 0.12, 0.055, metal, true);

  // The camera island sits on the rear face and is built from separate metal, glass and lens layers.
  const cameraBlock = new THREE.Group();
  cameraBlock.position.set(0.31, 0.79, -0.091);
  cameraBlock.rotation.y = Math.PI;
  phone.add(cameraBlock);
  const bump = new THREE.Mesh(new RoundedBoxGeometry(0.61, 0.72, 0.045, 10, 0.105), new THREE.MeshPhysicalMaterial({ color: 0x202226, metalness: 0.72, roughness: 0.28, clearcoat: 0.35, clearcoatRoughness: 0.26 }));
  cameraBlock.add(bump);
  for (const [x, y] of [[-0.17, 0.2], [-0.17, -0.18], [0.17, 0.01]]) addLens(cameraBlock, x, y);
  const flash = new THREE.Mesh(new THREE.CircleGeometry(0.055, 32), new THREE.MeshBasicMaterial({ color: 0xfff2d8 }));
  flash.position.set(0.19, 0.19, 0.052);
  cameraBlock.add(flash);
  const mic = new THREE.Mesh(new THREE.CircleGeometry(0.021, 20), new THREE.MeshBasicMaterial({ color: 0x08090c }));
  mic.position.set(0.19, 0.03, 0.053);
  cameraBlock.add(mic);
  const lidar = new THREE.Mesh(new THREE.CircleGeometry(0.047, 32), new THREE.MeshBasicMaterial({ color: 0x08090c }));
  lidar.position.set(0.19, -0.18, 0.053);
  cameraBlock.add(lidar);

  const logo = makeBackMark();
  logo.position.set(0, -0.08, -0.087);
  logo.rotation.y = Math.PI;
  phone.add(logo);

  phone.rotation.set(-0.11, -0.58, -0.035);
  phone.scale.setScalar(0.96);
  stage.classList.add('is-ready');

  let width = 0;
  let height = 0;
  const resize = () => {
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    width = bounds.width;
    height = bounds.height;
    camera.aspect = width / height;
    camera.position.z = width < 420 ? 6.15 : width < 700 ? 5.95 : 5.8;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();

  let dragging = false;
  let manuallyControlled = false;
  let lastX = 0;
  let lastY = 0;
  let lastMoveAt = 0;
  let velocity = 0;
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    dragging = true;
    manuallyControlled = true;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMoveAt = event.timeStamp;
    canvas.focus({ preventScroll: true });
    if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    const rotationDelta = dx * 0.018;
    phone.rotation.y += rotationDelta;
    phone.rotation.x = THREE.MathUtils.clamp(phone.rotation.x + dy * 0.014, -0.95, 0.95);
    velocity = rotationDelta / Math.max(8, event.timeStamp - lastMoveAt);
    lastX = event.clientX;
    lastY = event.clientY;
    lastMoveAt = event.timeStamp;
  });
  const endDrag = () => {
    dragging = false;
    canvas.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);
  canvas.addEventListener('keydown', event => {
    const turns = { ArrowLeft: 0.42, ArrowRight: -0.42, ArrowUp: 0.18, ArrowDown: -0.18 };
    if (!(event.key in turns)) return;
    event.preventDefault();
    manuallyControlled = true;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') phone.rotation.x = THREE.MathUtils.clamp(phone.rotation.x + turns[event.key], -0.95, 0.95);
    else phone.rotation.y += turns[event.key];
    velocity = 0;
  });
  stage.querySelectorAll('[data-phone-turn]').forEach(button => {
    button.addEventListener('click', () => {
      manuallyControlled = true;
      velocity = 0;
      phone.rotation.y += Number(button.dataset.phoneTurn) * Math.PI / 3;
      canvas.focus({ preventScroll: true });
    });
  });

  let inView = true;
  const visibility = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
  visibility.observe(stage);
  let previous = performance.now();
  const animate = now => {
    requestAnimationFrame(animate);
    const delta = Math.min(now - previous, 40);
    previous = now;
    if (document.hidden || !inView || !width) return;
    if (!dragging) {
      if (!reducedMotion && !manuallyControlled) phone.rotation.y += delta * (Math.PI * 2 / 10000);
      if (Math.abs(velocity) > 0.00001) {
        phone.rotation.y += velocity * delta;
        velocity *= 0.9;
      }
      phone.rotation.x += (-0.11 - phone.rotation.x) * Math.min(1, delta * 0.0025);
    }
    renderer.render(scene, camera);
  };
  requestAnimationFrame(animate);
}

function addSideButton(parent, x, y, z, height, material, bottom = false) {
  const geometry = new RoundedBoxGeometry(bottom ? 0.23 : 0.055, bottom ? 0.055 : height, bottom ? 0.09 : 0.075, 4, 0.024);
  const button = new THREE.Mesh(geometry, material);
  button.position.set(x, y, bottom ? z : 0);
  if (bottom) {
    button.position.set(0, -1.238, 0);
    parent.add(button);
    return;
  }
  parent.add(button);
}

function addLens(parent, x, y) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.018, 10, 40), new THREE.MeshStandardMaterial({ color: 0x414650, metalness: 0.95, roughness: 0.2 }));
  ring.position.set(x, y, 0.05);
  parent.add(ring);
  const outer = new THREE.Mesh(new THREE.CircleGeometry(0.098, 40), new THREE.MeshStandardMaterial({ color: 0x070a11, metalness: 0.5, roughness: 0.17, side: THREE.DoubleSide }));
  outer.position.set(x, y, 0.052);
  parent.add(outer);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.061, 40), new THREE.MeshPhysicalMaterial({ color: 0x15263e, metalness: 0.75, roughness: 0.08, clearcoat: 1, side: THREE.DoubleSide }));
  lens.position.set(x, y, 0.054);
  parent.add(lens);
  const glint = new THREE.Mesh(new THREE.CircleGeometry(0.018, 24), new THREE.MeshBasicMaterial({ color: 0x9cc6ff, side: THREE.DoubleSide }));
  glint.position.set(x - 0.018, y + 0.02, 0.056);
  parent.add(glint);
}

function makeScreenTexture() {
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = 512;
  canvasTexture.height = 1024;
  const ctx = canvasTexture.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 512, 1024);
  base.addColorStop(0, '#080a11');
  base.addColorStop(0.52, '#101521');
  base.addColorStop(1, '#040507');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 1024);
  const glowA = ctx.createRadialGradient(430, 300, 20, 420, 360, 370);
  glowA.addColorStop(0, 'rgba(176,202,255,.68)');
  glowA.addColorStop(0.3, 'rgba(76,108,170,.35)');
  glowA.addColorStop(1, 'rgba(6,10,18,0)');
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, 512, 1024);
  const glowB = ctx.createRadialGradient(60, 760, 4, 120, 690, 390);
  glowB.addColorStop(0, 'rgba(65,92,146,.62)');
  glowB.addColorStop(0.45, 'rgba(31,47,79,.34)');
  glowB.addColorStop(1, 'rgba(5,8,14,0)');
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, 512, 1024);
  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeBackMark() {
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 384;
  logoCanvas.height = 512;
  const context = logoCanvas.getContext('2d');
  context.fillStyle = '#65676c';
  const applePath = new Path2D('M318.7 268.7c-.2-37.7 16.8-66.1 50.9-86.9-19.1-27.3-47.9-42.3-85.9-45.2-36-2.8-75.3 21-89.6 21-15.1 0-49.9-20-77.5-20C59.6 138.1 4 178.8 4 259.5c0 23.8 4.4 48.4 13.2 73.9 11.8 34.1 54.4 117.6 98.9 116.1 24.6-.6 42-17.5 75.4-17.5 32.4 0 48.5 17.5 75.4 17.5 44.9-.7 83.4-76.7 94.6-111-60.1-28.3-64.4-68.1-64.8-69.8zm-60.9-169C282.5 74.1 300.6 43 297.1 12c-29 2-62.7 21.3-81.8 44.8-16.7 20.3-31.4 51.6-27.4 82.1 31.3 2.4 61.9-13.7 70-39.2z');
  context.fill(applePath);
  const texture = new THREE.CanvasTexture(logoCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.46, side: THREE.DoubleSide, toneMapped: false });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.267), material);
}

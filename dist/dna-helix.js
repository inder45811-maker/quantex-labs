import * as THREE from './vendor/three.module.min.js';

// Stylized B-DNA: the accepted two continuous backbones and 24 paired bases.
// 10.5 pairs per turn; 3.4 pitch / 2.0 diameter. This is a visual illustration.
const stage = document.querySelector('#helix-stage');
const host = document.querySelector('#helix-canvas');
const motion = document.querySelector('#motion-toggle');
const controls = stage.querySelector('.stage-controls');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compactMedia = matchMedia('(max-width: 700px)');
const COUNT = 24, PITCH = 3.4, RISE = PITCH / 10.5, RADIUS = 1;
const LENGTH = COUNT * RISE, RAIL = .102, BASE = .057, SEAM = .065;
const INITIAL_YAW = .26, INITIAL_PITCH = -.08, LEAN = -.36;
const colours = { railA: '#5be5ce', railB: '#b9e6f2', baseA: '#7dbef7', baseT: '#99e2d7', baseG: '#61a9e0', baseC: '#b8ede1', hydrogen: '#d4f1ee' };
const SETTLED = 1e-5, STILL = 1e-4;
let renderer, scene, camera, pose, helix, fallback, environment, keyLight;
let compact = compactMedia.matches, initialized = false, disposed = false, suspended = false, switching = false, ready = false;
let userPaused = false, autoRotate = !reducedMotion.matches, dragging = false, visible = true;
let yaw = INITIAL_YAW, targetYaw = yaw, pitch = INITIAL_PITCH, targetPitch = pitch;
let speed = 0, lastX = 0, lastY = 0, lastPointerTime = 0, lastTime = 0, frame = 0, idleTimer = 0;
let idleUntil = performance.now() + 1800, needsRender = true, fallbackDistance = 17.4;
const geometryParts = [];

function point(y, phase = 0) {
  const angle = y / PITCH * Math.PI * 2 + phase;
  return new THREE.Vector3(RADIUS * Math.cos(angle), y, -RADIUS * Math.sin(angle));
}
class Backbone extends THREE.Curve {
  constructor(phase) { super(); this.phase = phase; }
  getPoint(t, target = new THREE.Vector3()) { return target.copy(point((t - .5) * LENGTH, this.phase)); }
}
function material(colour, roughness = .24) {
  return new THREE.MeshPhysicalMaterial({ color: colour, roughness, metalness: .12, clearcoat: .9, clearcoatRoughness: .19, envMapIntensity: .7 });
}
function trackedGeometry(makeGeometry, meshes = []) {
  const part = { makeGeometry, meshes, geometry: makeGeometry(compact) };
  geometryParts.push(part);
  return part;
}
function makeStudio() {
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: '#31505b', side: THREE.BackSide })));
  for (const [x, y, z, sx, sy] of [[-7, 8, 6, 8, 10], [8, 3, 1, 5, 12], [0, 9, -5, 12, 5]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(sx, sy), new THREE.MeshBasicMaterial({ color: '#f0fffc' }));
    panel.position.set(x, y, z); panel.lookAt(0, 0, 0); room.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  try { environment = pmrem.fromScene(room, .06); scene.environment = environment.texture; }
  finally {
    pmrem.dispose();
    room.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
  }
}
function cylinder(from, to, radius, mat, group) {
  const direction = new THREE.Vector3().subVectors(to, from), length = direction.length();
  const part = trackedGeometry(small => new THREE.CylinderGeometry(radius, radius, length, small ? 10 : 14));
  const mesh = new THREE.Mesh(part.geometry, mat); part.meshes.push(mesh);
  mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = !compact; mesh.receiveShadow = !compact; group.add(mesh);
}
function buildScene() {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'default' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x071620, 0);
  renderer.shadowMap.enabled = !compact; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  host.appendChild(renderer.domElement); stage.dataset.renderer = 'webgl';
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(30, 1, .1, 80); camera.position.z = 17.4;
  pose = new THREE.Group(); pose.position.y = .35; pose.rotation.set(pitch, .04, LEAN);
  helix = new THREE.Group(); helix.rotation.y = yaw; pose.add(helix); scene.add(pose);
  const railMaterials = [material(colours.railA), material(colours.railB)];
  const caps = trackedGeometry(small => new THREE.SphereGeometry(RAIL, small ? 14 : 20, small ? 10 : 14));
  for (let chain = 0; chain < 2; chain++) {
    const part = trackedGeometry(small => new THREE.TubeGeometry(new Backbone(chain * Math.PI), small ? 240 : 360, RAIL, small ? 12 : 16, false));
    const rail = new THREE.Mesh(part.geometry, railMaterials[chain]); part.meshes.push(rail);
    rail.castShadow = !compact; rail.receiveShadow = !compact; helix.add(rail);
    for (const y of [-LENGTH / 2, LENGTH / 2]) {
      const cap = new THREE.Mesh(caps.geometry, railMaterials[chain]); caps.meshes.push(cap);
      cap.position.copy(point(y, chain * Math.PI)); cap.castShadow = !compact; cap.receiveShadow = !compact; helix.add(cap);
    }
  }
  const pairMaterials = Object.fromEntries(['baseA', 'baseT', 'baseG', 'baseC'].map(name => [name, material(colours[name], .3)]));
  const hydrogen = material(colours.hydrogen, .44);
  for (let i = 0; i < COUNT; i++) {
    const y = (i - (COUNT - 1) / 2) * RISE, a = point(y), b = point(y, Math.PI);
    const across = new THREE.Vector3().subVectors(b, a).normalize(), centre = new THREE.Vector3(0, y, 0);
    const first = i % 4 < 2 ? 'baseA' : 'baseG', second = i % 4 < 2 ? 'baseT' : 'baseC';
    const leftMat = i % 2 ? pairMaterials[second] : pairMaterials[first], rightMat = i % 2 ? pairMaterials[first] : pairMaterials[second];
    cylinder(a, centre.clone().addScaledVector(across, -SEAM), BASE, leftMat, helix);
    cylinder(centre.clone().addScaledVector(across, SEAM), b, BASE, rightMat, helix);
    const offsets = i % 4 < 2 ? [-.027, .027] : [-.035, 0, .035];
    for (const offset of offsets) {
      const c = centre.clone(); c.y += offset;
      cylinder(c.clone().addScaledVector(across, -SEAM), c.clone().addScaledVector(across, SEAM), .015, hydrogen, helix);
    }
  }
  makeStudio();
  scene.add(new THREE.HemisphereLight('#f6fffd', '#123349', .65));
  keyLight = new THREE.DirectionalLight('#e6fff9', 2.7); keyLight.position.set(-5, 7, 9); keyLight.castShadow = !compact;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .1, far: 30 });
  keyLight.shadow.bias = -.00005; keyLight.shadow.normalBias = .012; scene.add(keyLight);
  const fill = new THREE.DirectionalLight('#bcecff', .75); fill.position.set(5, 1, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight('#83ead9', 1.8); rim.position.set(2, 4, -6); scene.add(rim);
}

// The interactive 2D fallback uses the same curve and pair positions.
const fallbackLines = [];
function segment(a, b, radius, colour) { fallbackLines.push({ a, b, radius, colour, pa: {}, pb: {} }); }
for (let chain = 0; chain < 2; chain++) {
  for (let i = 0; i < 480; i++) segment(point((i / 480 - .5) * LENGTH, chain * Math.PI), point(((i + 1) / 480 - .5) * LENGTH, chain * Math.PI), RAIL, chain ? colours.railB : colours.railA);
}
for (let i = 0; i < COUNT; i++) {
  const y = (i - (COUNT - 1) / 2) * RISE, a = point(y), b = point(y, Math.PI);
  const first = i % 4 < 2 ? colours.baseA : colours.baseG, second = i % 4 < 2 ? colours.baseT : colours.baseC;
  for (let j = 0; j < 12; j++) segment(a.clone().lerp(b, j / 12), a.clone().lerp(b, (j + 1) / 12), BASE, j < 6 ? (i % 2 ? second : first) : (i % 2 ? first : second));
}
const fallbackPose = new THREE.Matrix4(), fallbackLocal = new THREE.Matrix4(), fallbackMatrix = new THREE.Matrix4();
const fallbackEuler = new THREE.Euler(), fallbackPoint = new THREE.Vector3();
function disposeWebGL() {
  const oldRenderer = renderer; renderer = undefined;
  oldRenderer?.domElement.removeEventListener('webglcontextlost', onContextLost);
  const geometries = new Set(), materials = new Set();
  scene?.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const mat of Array.isArray(object.material) ? object.material : [object.material]) if (mat) materials.add(mat);
    object.shadow?.dispose();
  });
  for (const part of geometryParts) geometries.add(part.geometry);
  for (const geometry of geometries) geometry.dispose();
  for (const mat of materials) mat.dispose();
  environment?.dispose(); environment = undefined;
  try { oldRenderer?.dispose(); } catch (error) { console.warn('DNA renderer cleanup:', error); }
  oldRenderer?.domElement.remove();
  scene = camera = pose = helix = keyLight = undefined; geometryParts.length = 0;
}
function setReady(value) {
  ready = value; stage.classList.toggle('is-ready', value);
  if (controls) {
    controls.hidden = !value;
    controls.setAttribute('aria-hidden', String(!value));
    for (const button of controls.querySelectorAll('button')) button.disabled = !value;
  }
}
function buildFallback() {
  setReady(false); disposeWebGL();
  for (const canvas of host.querySelectorAll('canvas')) canvas.remove();
  const canvas = document.createElement('canvas');
  fallback = canvas.getContext('2d');
  if (!fallback) throw new Error('DNA canvas rendering is unavailable.');
  host.appendChild(canvas); stage.dataset.renderer = 'canvas'; needsRender = true;
}
function drawFallback() {
  const ctx = fallback, width = ctx.canvas.width, height = ctx.canvas.height, focal = height / (2 * Math.tan(Math.PI / 12));
  fallbackEuler.set(pitch, .04, LEAN); fallbackPose.makeRotationFromEuler(fallbackEuler); fallbackLocal.makeRotationY(yaw);
  fallbackMatrix.multiplyMatrices(fallbackPose, fallbackLocal);
  const project = (point, screen) => {
    fallbackPoint.copy(point).applyMatrix4(fallbackMatrix); fallbackPoint.y += .35;
    const scale = focal / (fallbackDistance - fallbackPoint.z);
    screen.x = width / 2 + fallbackPoint.x * scale; screen.y = height / 2 - fallbackPoint.y * scale;
    screen.z = fallbackPoint.z; screen.scale = scale;
  };
  ctx.clearRect(0, 0, width, height); ctx.lineCap = 'round';
  for (const line of fallbackLines) { project(line.a, line.pa); project(line.b, line.pb); }
  fallbackLines.sort((a, b) => (a.pa.z + a.pb.z) - (b.pa.z + b.pb.z));
  for (const line of fallbackLines) {
    ctx.lineWidth = line.radius * (line.pa.scale + line.pb.scale); ctx.strokeStyle = line.colour;
    ctx.beginPath(); ctx.moveTo(line.pa.x, line.pa.y); ctx.lineTo(line.pb.x, line.pb.y); ctx.stroke();
    ctx.lineWidth = Math.max(1, ctx.lineWidth * .24); ctx.strokeStyle = 'rgba(255,255,255,.32)';
    ctx.beginPath(); ctx.moveTo(line.pa.x - 1, line.pa.y - 1); ctx.lineTo(line.pb.x - 1, line.pb.y - 1); ctx.stroke();
  }
}
function onContextLost(event) {
  event.preventDefault();
  if (disposed || switching) return;
  switching = true; stop(); setReady(false);
  // Dispose outside the WebGL event dispatch/render call before changing renderer.
  queueMicrotask(() => {
    if (disposed) { switching = false; return; }
    try { buildFallback(); resize(); }
    catch (error) { console.warn('Static DNA fallback remains active.', error); }
    switching = false; wake();
  });
}
function applyQuality(nextCompact) {
  if (!renderer) { compact = nextCompact; return; }
  if (compact !== nextCompact) {
    compact = nextCompact;
    for (const part of geometryParts) {
      const oldGeometry = part.geometry; part.geometry = part.makeGeometry(compact);
      for (const mesh of part.meshes) mesh.geometry = part.geometry;
      oldGeometry.dispose();
    }
    helix.traverse(object => { if (object.isMesh) { object.castShadow = !compact; object.receiveShadow = !compact; } });
    keyLight.castShadow = !compact; renderer.shadowMap.enabled = !compact;
    if (compact) {
      keyLight.shadow.map?.dispose(); keyLight.shadow.map = null;
      keyLight.shadow.mapPass?.dispose(); keyLight.shadow.mapPass = null;
    }
    renderer.shadowMap.needsUpdate = true;
  }
  const ratio = Math.min(devicePixelRatio || 1, compact ? 1.3 : 1.6);
  if (renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio);
}
function resize() {
  if (disposed) return;
  const { width, height } = stage.getBoundingClientRect(); if (!width || !height) return;
  applyQuality(compactMedia.matches); fallbackDistance = width / height < .8 ? 18.5 : 17.4;
  if (renderer) {
    camera.aspect = width / height; camera.position.z = fallbackDistance; camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
  } else if (fallback) {
    const ratio = Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.5);
    fallback.canvas.width = Math.round(width * ratio); fallback.canvas.height = Math.round(height * ratio);
  }
  needsRender = true; wake();
}
function render() {
  try {
    if (renderer) { helix.rotation.y = yaw; pose.rotation.x = pitch; renderer.render(scene, camera); }
    else if (fallback) drawFallback();
    else return false;
    needsRender = false; if (!ready) setReady(true);
    return true;
  } catch (error) {
    if (renderer) {
      console.warn('Using canvas DNA renderer.', error);
      try { buildFallback(); resize(); drawFallback(); needsRender = false; setReady(true); return true; }
      catch (fallbackError) { console.warn('Static DNA fallback remains active.', fallbackError); }
    }
    needsRender = false; setReady(false); return false;
  }
}

// At most one frame or delayed wake is pending. Paused/settled and hidden states
// have no RAF loop; the short idle delay before rotation uses a single timeout.
function canRun() { return initialized && !disposed && !suspended && !switching && visible && !document.hidden && Boolean(renderer || fallback); }
function stop() {
  if (frame) cancelAnimationFrame(frame); if (idleTimer) clearTimeout(idleTimer);
  frame = idleTimer = 0; lastTime = 0;
}
function requestFrame() { if (!frame && canRun()) frame = requestAnimationFrame(animate); }
function wake() {
  if (idleTimer) clearTimeout(idleTimer); idleTimer = 0;
  if (!canRun()) return;
  if (!frame) lastTime = 0;
  requestFrame();
}
function plan(time) {
  if (!canRun()) { stop(); return; }
  const moving = Math.abs(targetYaw - yaw) > SETTLED || Math.abs(targetPitch - pitch) > SETTLED || (!dragging && Math.abs(speed) >= STILL);
  if (needsRender || moving || (autoRotate && !dragging && time >= idleUntil)) { requestFrame(); return; }
  if (autoRotate && !dragging && !idleTimer) {
    idleTimer = setTimeout(() => { idleTimer = 0; wake(); }, Math.max(1, Math.ceil(idleUntil - performance.now())));
  }
  lastTime = 0;
}
function animate(time) {
  frame = 0;
  if (!canRun()) { stop(); return; }
  const dt = lastTime ? Math.min(Math.max((time - lastTime) / 1000, 0), .04) : 1 / 60; lastTime = time;
  if (!dragging) {
    if (autoRotate && time >= idleUntil) targetYaw += dt * .12;
    targetYaw += speed * dt; speed *= Math.exp(-dt * 6); if (Math.abs(speed) < STILL) speed = 0;
  }
  const oldYaw = yaw, oldPitch = pitch, ease = 1 - Math.exp(-dt * 12);
  yaw += (targetYaw - yaw) * ease; pitch += (targetPitch - pitch) * ease;
  if (Math.abs(targetYaw - yaw) <= SETTLED) yaw = targetYaw;
  if (Math.abs(targetPitch - pitch) <= SETTLED) pitch = targetPitch;
  if ((needsRender || oldYaw !== yaw || oldPitch !== pitch) && !render()) { stop(); return; }
  plan(time);
}
function motionLabel() {
  motion.textContent = autoRotate ? 'Pause motion' : 'Resume motion';
  motion.setAttribute('aria-label', autoRotate ? 'Pause DNA rotation' : 'Resume DNA rotation');
  motion.setAttribute('aria-pressed', String(!autoRotate));
}
function release(event) {
  if (!dragging) return;
  dragging = false; stage.classList.remove('dragging');
  if (event?.type === 'pointercancel' || performance.now() - lastPointerTime > 80) speed = 0;
  idleUntil = performance.now() + 2000; wake();
}
stage.addEventListener('pointerdown', event => {
  if (!ready || !event.isPrimary || event.button !== 0 || event.target.closest('button')) return;
  dragging = true; speed = 0; lastX = event.clientX; lastY = event.clientY; lastPointerTime = event.timeStamp;
  stage.setPointerCapture(event.pointerId); stage.classList.add('dragging'); wake();
});
stage.addEventListener('pointermove', event => {
  if (!dragging) return;
  const dx = event.clientX - lastX, dy = event.clientY - lastY, dt = Math.max((event.timeStamp - lastPointerTime) / 1000, .008);
  targetYaw += dx * .008; speed = autoRotate ? THREE.MathUtils.clamp(dx * .003 / dt, -1.8, 1.8) : 0;
  targetPitch = THREE.MathUtils.clamp(targetPitch + dy * .002, -.26, .26);
  lastX = event.clientX; lastY = event.clientY; lastPointerTime = event.timeStamp; needsRender = true; wake();
});
stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release); stage.addEventListener('lostpointercapture', release);
stage.addEventListener('keydown', event => {
  if (!ready || event.target.closest('button')) return;
  if (event.key === 'ArrowLeft') targetYaw -= .2; else if (event.key === 'ArrowRight') targetYaw += .2;
  else if (event.key === 'ArrowUp') targetPitch = Math.max(-.26, targetPitch - .05);
  else if (event.key === 'ArrowDown') targetPitch = Math.min(.26, targetPitch + .05); else return;
  speed = 0; idleUntil = performance.now() + 2000; needsRender = true; event.preventDefault(); wake();
});
motion.addEventListener('click', () => {
  autoRotate = !autoRotate; userPaused = !autoRotate; speed = 0;
  if (!autoRotate) targetYaw = yaw;
  motionLabel(); wake();
});
document.querySelector('#helix-reset')?.addEventListener('click', () => {
  targetYaw = INITIAL_YAW; targetPitch = INITIAL_PITCH; speed = 0; idleUntil = performance.now() + 2000; needsRender = true; wake();
});
reducedMotion.addEventListener('change', event => {
  autoRotate = !event.matches && !userPaused; speed = 0; targetYaw = yaw; motionLabel(); wake();
});
compactMedia.addEventListener('change', resize);
function nearViewport() {
  const rect = stage.getBoundingClientRect();
  return rect.bottom >= -80 && rect.top <= innerHeight + 80 && rect.right >= 0 && rect.left <= innerWidth;
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { dragging = false; speed = 0; stage.classList.remove('dragging'); stop(); }
  else { visible = nearViewport(); needsRender = true; wake(); }
});
addEventListener('resize', resize);
addEventListener('pagehide', event => {
  suspended = true; dragging = false; speed = 0; stage.classList.remove('dragging'); stop();
  if (!event.persisted) {
    disposed = true; resizeObserver.disconnect(); intersectionObserver.disconnect(); disposeWebGL();
  }
});
addEventListener('pageshow', event => {
  if (event.persisted) { suspended = false; visible = nearViewport(); needsRender = true; wake(); }
});

setReady(false); motionLabel();
try { buildScene(); }
catch (error) {
  console.warn('Using canvas DNA renderer.', error);
  try { buildFallback(); } catch (fallbackError) { console.warn('Static DNA fallback remains active.', fallbackError); }
}
resize(); render(); stage.dataset.model = 'paired-dna-double-helix';
initialized = true; visible = nearViewport();
const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(stage);
const intersectionObserver = new IntersectionObserver(entries => {
  visible = entries[0].isIntersecting;
  if (visible) { needsRender = true; wake(); }
  else { dragging = false; speed = 0; stage.classList.remove('dragging'); stop(); }
}, { rootMargin: '80px' });
intersectionObserver.observe(stage); wake();

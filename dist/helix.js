import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';

const stage = document.querySelector('#helix-stage');
const host = document.querySelector('#helix-canvas');
const motionButton = document.querySelector('#motion-toggle');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let renderer;

try {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  stage.classList.add('helix-fallback');
}

if (renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
  camera.position.set(0, 0, 12.8);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0xffffff, 0);
  host.appendChild(renderer.domElement);

  const helix = new THREE.Group();
  scene.add(helix);
  const positions = [];
  const colors = [];
  const scales = [];
  const turns = 3.25;
  const strandSteps = 240;
  const start = -3.75;
  const height = 7.5;
  const radius = 1.28;
  const violet = new THREE.Color('#6320ce');
  const lilac = new THREE.Color('#9437d6');
  const pink = new THREE.Color('#bc33b7');
  const cyan = new THREE.Color('#77dce8');
  const strandCurves = [[], []];

  function strandPoint(t, strand) {
    const angle = t * Math.PI * 2 * turns + strand * Math.PI;
    return new THREE.Vector3(Math.cos(angle) * radius, start + t * height, Math.sin(angle) * radius);
  }

  for (let strand = 0; strand < 2; strand++) {
    for (let i = 0; i < strandSteps; i++) {
      const t = i / (strandSteps - 1);
      const point = strandPoint(t, strand);
      const micro = Math.sin(i * 21.37 + strand * 13.5);
      point.x += Math.cos(i * 8.1) * 0.045;
      point.z += Math.sin(i * 5.7) * 0.04;
      positions.push(point);
      const color = (i % 19 === 0) ? cyan : (strand ? pink : violet).clone().lerp(lilac, (micro + 1) * 0.32);
      colors.push(color);
      scales.push(0.11 + (Math.sin(i * 4.27 + strand) + 1) * 0.027);
      strandCurves[strand].push(strandPoint(t, strand));
    }
  }

  for (let rung = 0; rung < 54; rung++) {
    const t = (rung + 0.5) / 54;
    const a = strandPoint(t, 0);
    const b = strandPoint(t, 1);
    for (let bead = 1; bead < 10; bead++) {
      positions.push(a.clone().lerp(b, bead / 10));
      colors.push(bead % 3 === 0 ? cyan : lilac);
      scales.push(0.043 + (bead % 3 === 0 ? 0.008 : 0));
    }
  }

  const sphere = new THREE.SphereGeometry(1, 10, 8);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.18, roughness: 0.23 });
  const beads = new THREE.InstancedMesh(sphere, material, positions.length);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  positions.forEach((position, index) => {
    matrix.compose(position, quaternion, new THREE.Vector3(scales[index], scales[index], scales[index]));
    beads.setMatrixAt(index, matrix);
    beads.setColorAt(index, colors[index]);
  });
  beads.instanceMatrix.needsUpdate = true;
  beads.instanceColor.needsUpdate = true;
  helix.add(beads);

  strandCurves.forEach((points, index) => {
    const curve = new THREE.CatmullRomCurve3(points);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 360, 0.035, 6, false),
      new THREE.MeshStandardMaterial({ color: index ? '#bc4ad7' : '#7435d8', metalness: 0.2, roughness: 0.35, transparent: true, opacity: 0.84 })
    );
    helix.add(tube);
  });

  const dustPositions = new Float32Array(240 * 3);
  for (let i = 0; i < 240; i++) {
    const a = i * 2.39996;
    const spread = 2.15 + ((i * 73) % 31) / 19;
    dustPositions[i * 3] = Math.cos(a) * spread;
    dustPositions[i * 3 + 1] = -4.2 + ((i * 47) % 240) / 28;
    dustPositions[i * 3 + 2] = Math.sin(a) * spread - 1.8;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#b694eb', size: 0.025, transparent: true, opacity: 0.55 }));
  helix.add(dust);

  scene.add(new THREE.AmbientLight(0xffffff, 1.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-3, 5, 8);
  scene.add(key);
  const rim = new THREE.PointLight('#d885ff', 52);
  rim.position.set(4, -1, 3);
  scene.add(rim);
  const fill = new THREE.PointLight('#7ee7f3', 33);
  fill.position.set(-4, 1, -1);
  scene.add(fill);

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetY = 0.42;
  let targetX = -0.12;
  let autoRotate = !prefersReducedMotion.matches;
  let visible = true;
  let lastTime = 0;
  helix.rotation.set(targetX, targetY, -0.27);

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.position.z = width < 550 ? 14.8 : 12.8;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }
  new ResizeObserver(resize).observe(stage);
  resize();
  document.documentElement.classList.add('has-webgl');

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('button')) return;
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove', event => {
    const rect = stage.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointerY = (event.clientY - rect.top) / rect.height * 2 - 1;
    if (!isDragging) return;
    targetY += (event.clientX - lastX) * 0.009;
    targetX = THREE.MathUtils.clamp(targetX + (event.clientY - lastY) * 0.005, -0.85, 0.85);
    lastX = event.clientX;
    lastY = event.clientY;
  });
  function endDrag() { isDragging = false; stage.classList.remove('dragging'); }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') targetY -= 0.2;
    else if (event.key === 'ArrowRight') targetY += 0.2;
    else if (event.key === 'ArrowUp') targetX = THREE.MathUtils.clamp(targetX - 0.16, -0.85, 0.85);
    else if (event.key === 'ArrowDown') targetX = THREE.MathUtils.clamp(targetX + 0.16, -0.85, 0.85);
    else return;
    event.preventDefault();
  });
  motionButton.addEventListener('click', () => {
    autoRotate = !autoRotate;
    motionButton.textContent = autoRotate ? 'Pause motion' : 'Resume motion';
    motionButton.setAttribute('aria-label', autoRotate ? 'Pause helix rotation' : 'Resume helix rotation');
    motionButton.setAttribute('aria-pressed', String(!autoRotate));
  });
  if (!autoRotate) {
    motionButton.textContent = 'Resume motion';
    motionButton.setAttribute('aria-label', 'Resume helix rotation');
    motionButton.setAttribute('aria-pressed', 'true');
  }
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { rootMargin: '100px' }).observe(stage);

  function animate(time) {
    requestAnimationFrame(animate);
    if (!visible || document.hidden) { lastTime = time; return; }
    const delta = Math.min((time - lastTime) / 1000 || 0, 0.05);
    lastTime = time;
    if (autoRotate && !isDragging) targetY += delta * 0.14;
    helix.rotation.y += (targetY + (isDragging ? 0 : pointerX * 0.12) - helix.rotation.y) * 0.06;
    helix.rotation.x += (targetX + (isDragging ? 0 : -pointerY * 0.06) - helix.rotation.x) * 0.06;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}

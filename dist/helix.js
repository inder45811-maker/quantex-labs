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
  const turns = 2.35;
  const strandSteps = 320;
  const start = -3.75;
  const height = 7.5;
  const radius = 1.38;
  const strandPoints = [[], []];

  function strandPoint(t, strand) {
    const angle = t * Math.PI * 2 * turns - Math.PI * 0.28 + strand * Math.PI;
    return new THREE.Vector3(Math.cos(angle) * radius, start + t * height, Math.sin(angle) * radius * 0.82);
  }

  for (let strand = 0; strand < 2; strand++) {
    for (let i = 0; i < strandSteps; i++) {
      const t = i / (strandSteps - 1);
      strandPoints[strand].push(strandPoint(t, strand));
    }
  }

  const backboneMaterials = [
    new THREE.MeshStandardMaterial({ color: '#5f24d3', metalness: 0.16, roughness: 0.26 }),
    new THREE.MeshStandardMaterial({ color: '#28b5cf', metalness: 0.12, roughness: 0.28 })
  ];
  strandPoints.forEach((points, index) => {
    const curve = new THREE.CatmullRomCurve3(points);
    helix.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 500, 0.115, 10, false), backboneMaterials[index]));
  });

  const baseMaterials = [
    new THREE.MeshStandardMaterial({ color: '#b144e0', metalness: 0.08, roughness: 0.38 }),
    new THREE.MeshStandardMaterial({ color: '#81dbe5', metalness: 0.08, roughness: 0.38 }),
    new THREE.MeshStandardMaterial({ color: '#e66cc7', metalness: 0.08, roughness: 0.38 }),
    new THREE.MeshStandardMaterial({ color: '#7798e8', metalness: 0.08, roughness: 0.38 })
  ];
  const rungCount = 30;
  const yAxis = new THREE.Vector3(0, 1, 0);
  for (let rung = 0; rung < rungCount; rung++) {
    const t = (rung + 0.5) / rungCount;
    const a = strandPoint(t, 0);
    const b = strandPoint(t, 1);
    const middle = a.clone().lerp(b, 0.5);
    for (let half = 0; half < 2; half++) {
      const from = half === 0 ? a : middle;
      const to = half === 0 ? middle : b;
      const direction = to.clone().sub(from);
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, direction.length(), 10),
        baseMaterials[(rung + half * 2) % baseMaterials.length]
      );
      bar.position.copy(from).add(to).multiplyScalar(0.5);
      bar.quaternion.setFromUnitVectors(yAxis, direction.normalize());
      helix.add(bar);
    }
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.092, 12, 10), baseMaterials[rung % baseMaterials.length]);
    joint.position.copy(middle);
    helix.add(joint);
  }

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
  let targetY = 0.06;
  let targetX = -0.05;
  let autoRotate = !prefersReducedMotion.matches;
  let visible = true;
  let lastTime = 0;
  helix.rotation.set(targetX, targetY, -0.1);

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

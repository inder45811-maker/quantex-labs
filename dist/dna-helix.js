import * as THREE from './vendor/three.module.min.js';

// Stylized B-DNA: two continuous backbones and 24 paired bases.
// 10.5 pairs per turn; 3.4 pitch / 2.0 diameter. This is a visual illustration.
const stage = document.querySelector('#helix-stage');
const host = document.querySelector('#helix-canvas');
const motion = document.querySelector('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 700px)').matches;
const COUNT = 24, PITCH = 3.4, RISE = PITCH / 10.5, RADIUS = 1;
const LENGTH = COUNT * RISE, RAIL = .102, BASE = .057, SEAM = .065;
const INITIAL_YAW = .26, INITIAL_PITCH = -.08, LEAN = -.36;
const colours = {railA:'#702ce3',railB:'#ac66e8',baseA:'#c8a4f3',baseT:'#79ced8',baseG:'#aa85df',baseC:'#9cdbdf',hydrogen:'#d7c6ec'};
let renderer, scene, camera, pose, helix, fallback, environment;
let autoRotate = !reducedMotion.matches, dragging = false, visible = true;
let yaw = INITIAL_YAW, targetYaw = yaw, pitch = INITIAL_PITCH, targetPitch = pitch;
let speed = 0, lastX = 0, lastY = 0, lastPointerTime = 0, lastTime = 0, frame = 0;
let idleUntil = performance.now()+1800, needsRender = true;

function point(y, phase = 0) {
  const angle = y / PITCH * Math.PI * 2 + phase;
  return new THREE.Vector3(RADIUS*Math.cos(angle), y, -RADIUS*Math.sin(angle));
}
class Backbone extends THREE.Curve {
  constructor(phase) { super(); this.phase = phase; }
  getPoint(t, target = new THREE.Vector3()) { return target.copy(point((t-.5)*LENGTH, this.phase)); }
}
function material(colour, roughness = .24) {
  return new THREE.MeshPhysicalMaterial({color:colour,roughness,metalness:.12,clearcoat:.9,clearcoatRoughness:.19,envMapIntensity:.7});
}
function makeStudio() {
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(new THREE.BoxGeometry(30,30,30),new THREE.MeshBasicMaterial({color:'#b8a6cd',side:THREE.BackSide})));
  for (const [x,y,z,sx,sy] of [[-7,8,6,8,10],[8,3,1,5,12],[0,9,-5,12,5]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),new THREE.MeshBasicMaterial({color:'#ffffff'}));
    panel.position.set(x,y,z);panel.lookAt(0,0,0);room.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);environment = pmrem.fromScene(room,.06);scene.environment = environment.texture;
  pmrem.dispose();room.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});
}
function cylinder(from, to, radius, mat, group) {
  const d = new THREE.Vector3().subVectors(to,from);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,d.length(),compact?12:20),mat);
  mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  mesh.castShadow = !compact;mesh.receiveShadow = !compact;group.add(mesh);
}
function buildScene() {
  renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,compact?1.5:1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;renderer.toneMapping = THREE.ACESFilmicToneMapping;renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0xffffff,0);renderer.shadowMap.enabled = !compact;renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);stage.dataset.renderer="webgl";
  scene = new THREE.Scene();camera = new THREE.PerspectiveCamera(30,1,.1,80);camera.position.z = 17.4;
  pose = new THREE.Group();pose.position.y=.35;pose.rotation.set(pitch,.04,LEAN);
  helix = new THREE.Group();helix.rotation.y = yaw;pose.add(helix);scene.add(pose);
  const railMaterials = [material(colours.railA),material(colours.railB)];
  const capGeometry = new THREE.SphereGeometry(RAIL,compact?16:24,compact?12:18);
  for(let chain = 0;chain < 2;chain++) {
    const rail = new THREE.Mesh(new THREE.TubeGeometry(new Backbone(chain*Math.PI),compact?300:600,RAIL,compact?16:24,false),railMaterials[chain]);
    rail.castShadow = !compact;rail.receiveShadow = !compact;helix.add(rail);
    for(const y of [-LENGTH/2,LENGTH/2]) {const cap = new THREE.Mesh(capGeometry,railMaterials[chain]);cap.position.copy(point(y,chain*Math.PI));cap.castShadow = !compact;helix.add(cap);}
  }
  const pairMaterials = Object.fromEntries(['baseA','baseT','baseG','baseC'].map(name=>[name,material(colours[name],.3)]));
  const hydrogen = material(colours.hydrogen,.44);
  for(let i = 0;i < COUNT;i++) {
    const y = (i-(COUNT-1)/2)*RISE, a = point(y), b = point(y,Math.PI);
    const across = new THREE.Vector3().subVectors(b,a).normalize(), centre = new THREE.Vector3(0,y,0);
    const first = i%4<2?'baseA':'baseG', second = i%4<2?'baseT':'baseC';
    const leftMat = i%2?pairMaterials[second]:pairMaterials[first],rightMat = i%2?pairMaterials[first]:pairMaterials[second];
    cylinder(a,centre.clone().addScaledVector(across,-SEAM),BASE,leftMat,helix);
    cylinder(centre.clone().addScaledVector(across,SEAM),b,BASE,rightMat,helix);
    // Two or three small bridges make the paired bases visibly join at the centre.
    const offsets = i%4<2?[-.027,.027]:[-.035,0,.035];
    for(const offset of offsets) {
      const c = centre.clone();c.y+=offset;
      cylinder(c.clone().addScaledVector(across,-SEAM),c.clone().addScaledVector(across,SEAM),.015,hydrogen,helix);
    }
  }
  makeStudio();
  scene.add(new THREE.HemisphereLight('#ffffff','#442768',.65));
  const key = new THREE.DirectionalLight('#fff8ff',2.7);key.position.set(-5,7,9);key.castShadow = !compact;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:30});
  key.shadow.bias = -.00005;key.shadow.normalBias = .012;scene.add(key);
  const fill = new THREE.DirectionalLight('#d9f9ff',.75);fill.position.set(5,1,4);scene.add(fill);
  const rim = new THREE.DirectionalLight('#e6c0ff',1.8);rim.position.set(2,4,-6);scene.add(rim);
}

// A depth-sorted canvas renderer preserves the same helix if WebGL is unavailable.
const fallbackSegments = [];
function segment(a,b,r,colour) { fallbackSegments.push({a,b,r,colour}); }
for(let chain=0;chain<2;chain++)for(let i=0;i<480;i++)segment(point((i/480-.5)*LENGTH,chain*Math.PI),point(((i+1)/480-.5)*LENGTH,chain*Math.PI),RAIL,chain?colours.railB:colours.railA);
for(let i=0;i<COUNT;i++) {
  const y=(i-(COUNT-1)/2)*RISE,a=point(y),b=point(y,Math.PI),centre=new THREE.Vector3(0,y,0);
  const first=i%4<2?colours.baseA:colours.baseG,second=i%4<2?colours.baseT:colours.baseC;
  for(let j=0;j<12;j++)segment(a.clone().lerp(b,j/12),a.clone().lerp(b,(j+1)/12),BASE,j<6?(i%2?second:first):(i%2?first:second));
}
function buildFallback() {
  renderer?.dispose();environment?.dispose();renderer=null;host.replaceChildren();
  const canvas=document.createElement('canvas');host.appendChild(canvas);fallback=canvas.getContext('2d');stage.dataset.renderer="canvas";
}
function drawFallback() {
  const ctx=fallback,w=ctx.canvas.width,h=ctx.canvas.height,f=h/(2*Math.tan(Math.PI/12));
  const rotation = new THREE.Euler(pitch,.04,LEAN), local = new THREE.Euler(0,yaw,0);
  const project = v=>{const p=v.clone().applyEuler(local).applyEuler(rotation);p.y+=.35;const d=17.4-p.z;return{x:w/2+p.x*f/d,y:h/2-p.y*f/d,z:p.z,s:f/d};};
  ctx.clearRect(0,0,w,h);ctx.lineCap='round';
  const lines=fallbackSegments.map(s=>({...s,a:project(s.a),b:project(s.b)})).sort((a,b)=>(a.a.z+a.b.z)-(b.a.z+b.b.z));
  for(const l of lines) {
    ctx.lineWidth=l.r*(l.a.s+l.b.s);ctx.strokeStyle=l.colour;ctx.beginPath();ctx.moveTo(l.a.x,l.a.y);ctx.lineTo(l.b.x,l.b.y);ctx.stroke();
    ctx.lineWidth=Math.max(1,ctx.lineWidth*.24);ctx.strokeStyle='rgba(255,255,255,.32)';ctx.beginPath();ctx.moveTo(l.a.x-1,l.a.y-1);ctx.lineTo(l.b.x-1,l.b.y-1);ctx.stroke();
  }
}
function resize() {
  const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;
  if(renderer) {camera.aspect=width/height;camera.position.z=camera.aspect<.8?18.5:17.4;camera.updateProjectionMatrix();renderer.setSize(width,height,false);}
  else if(fallback) {fallback.canvas.width=Math.round(width*1.5);fallback.canvas.height=Math.round(height*1.5);}
  needsRender=true;
}
function render() {
  if(renderer) {helix.rotation.y=yaw;pose.rotation.x=pitch;renderer.render(scene,camera);}else if(fallback)drawFallback();
  needsRender=false;
}
function animate(time) {
  frame=requestAnimationFrame(animate);const dt=Math.min((time-lastTime)/1000||0,.04);lastTime=time;
  if(!visible||document.hidden)return;
  if(!dragging) {
    if(autoRotate&&time>idleUntil)targetYaw+=dt*.12;
    targetYaw+=speed*dt;speed*=Math.exp(-dt*6);
  }
  const oldYaw=yaw,oldPitch=pitch,ease=1-Math.exp(-dt*12);
  yaw+=(targetYaw-yaw)*ease;pitch+=(targetPitch-pitch)*ease;
  if(needsRender||Math.abs(oldYaw-yaw)>1e-6||Math.abs(oldPitch-pitch)>1e-6)render();
}
function motionLabel() {
  motion.textContent=autoRotate?'Pause motion':'Resume motion';
  motion.setAttribute('aria-label',autoRotate?'Pause DNA rotation':'Resume DNA rotation');motion.setAttribute('aria-pressed',String(!autoRotate));
}
function release() {dragging=false;stage.classList.remove('dragging');idleUntil=performance.now()+2000;}
stage.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0||event.target.closest('button'))return;
  dragging=true;speed=0;lastX=event.clientX;lastY=event.clientY;lastPointerTime=event.timeStamp;stage.setPointerCapture(event.pointerId);stage.classList.add('dragging');
});
stage.addEventListener('pointermove',event=>{
  if(!dragging)return;const dx=event.clientX-lastX,dy=event.clientY-lastY,dt=Math.max((event.timeStamp-lastPointerTime)/1000,.008);
  targetYaw+=dx*.008;speed=autoRotate?THREE.MathUtils.clamp(dx*.003/dt,-1.8,1.8):0;
  targetPitch=THREE.MathUtils.clamp(targetPitch+dy*.002,-.26,.26);lastX=event.clientX;lastY=event.clientY;lastPointerTime=event.timeStamp;needsRender=true;
});
stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);
stage.addEventListener('keydown',event=>{
  if(event.target.closest('button'))return;
  if(event.key==='ArrowLeft')targetYaw-=.2;else if(event.key==='ArrowRight')targetYaw+=.2;
  else if(event.key==='ArrowUp')targetPitch=Math.max(-.26,targetPitch-.05);else if(event.key==='ArrowDown')targetPitch=Math.min(.26,targetPitch+.05);else return;
  speed=0;idleUntil=performance.now()+2000;event.preventDefault();
});
motion.addEventListener('click',()=>{autoRotate=!autoRotate;speed=0;if(!autoRotate)targetYaw=yaw;motionLabel();});
document.querySelector('#helix-reset')?.addEventListener('click',()=>{targetYaw=INITIAL_YAW;targetPitch=INITIAL_PITCH;speed=0;idleUntil=performance.now()+2000;needsRender=true;});
reducedMotion.addEventListener('change',event=>{autoRotate=!event.matches;speed=0;targetYaw=yaw;motionLabel();});
addEventListener('pagehide',event=>{cancelAnimationFrame(frame);if(!event.persisted){renderer?.dispose();environment?.dispose();}});
addEventListener('pageshow',event=>{if(event.persisted){lastTime=0;needsRender=true;requestAnimationFrame(animate);}});
try {buildScene();}catch(error) {buildFallback();console.warn('Using canvas DNA renderer.',error);}
resize();render();stage.classList.remove('helix-fallback');document.documentElement.classList.add('has-webgl');stage.dataset.model='paired-dna-double-helix';
new ResizeObserver(resize).observe(stage);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)needsRender=true;},{rootMargin:'80px'}).observe(stage);
motionLabel();requestAnimationFrame(animate);

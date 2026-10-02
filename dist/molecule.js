import * as THREE from './vendor/three.module.min.js';

// Idealized 24-base-pair B-DNA, derived from RCSB PDB 1BNA atomic coordinates.
// Reproducible data generator: scripts/build-dna.mjs.
const stage = document.querySelector('#helix-stage');
const host = document.querySelector('#helix-canvas');
const motion = document.querySelector('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 700px)').matches;
let renderer, scene, camera, pose, molecule, model, fallback;
let autoRotate = !reducedMotion.matches, dragging = false, visible = true;
let yaw=.56, targetYaw=.56, pitch=-.13, targetPitch=-.13, velocity=0;
let lastX=0, lastY=0, lastTime=0, frame=0;

function motionLabel() {
  motion.textContent=autoRotate?'Pause motion':'Resume motion';
  motion.setAttribute('aria-label',autoRotate?'Pause DNA rotation':'Resume DNA rotation');
  motion.setAttribute('aria-pressed',String(!autoRotate));
}
function buildScene() {
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,compact?1.5:1.8));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  renderer.setClearColor(0xffffff,0);
  renderer.shadowMap.enabled=!compact;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(33,1,.1,80);
  camera.position.set(0,0,15.6);
  pose=new THREE.Group(); pose.rotation.set(pitch,.12,-.34);
  molecule=new THREE.Group(); molecule.rotation.y=yaw;
  pose.add(molecule); scene.add(pose);
  const scale=.095, transform=new THREE.Object3D(), colour=new THREE.Color();
  const atoms=new THREE.InstancedMesh(
    new THREE.SphereGeometry(1,compact?12:20,compact?9:14),
    new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:.08,roughness:.28,clearcoat:.65,clearcoatRoughness:.2}),
    model.atoms.length
  );
  model.atoms.forEach(([x,y,z,r,backbone,chain,element],i)=>{
    transform.position.set(x*scale,y*scale,z*scale);
    transform.scale.setScalar(r*scale*(backbone ? .74 : .61)); transform.updateMatrix();
    atoms.setMatrixAt(i,transform.matrix);
    let hex=backbone?(chain?'#9d50d4':'#6b30c3'):'#a781d2';
    if(element==='P')hex=chain?'#d094e8':'#8950d7';
    if(!backbone&&element==='N')hex='#c1a1e5';
    if(element==='O')hex=backbone?'#b979de':'#d4b9ed';
    if(!backbone&&i%29===0)hex='#8ddadd';
    atoms.setColorAt(i,colour.set(hex));
  });
  atoms.instanceMatrix.needsUpdate=true;atoms.instanceColor.needsUpdate=true;
  atoms.castShadow=!compact;atoms.receiveShadow=!compact;molecule.add(atoms);
  const bonds=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,compact?5:7),new THREE.MeshStandardMaterial({color:'#a47bce',roughness:.45,metalness:.05}),model.bonds.length);
  const from=new THREE.Vector3(),to=new THREE.Vector3(),direction=new THREE.Vector3(),yAxis=new THREE.Vector3(0,1,0);
  model.bonds.forEach(([a,b],i)=>{
    from.fromArray(model.atoms[a]).multiplyScalar(scale);to.fromArray(model.atoms[b]).multiplyScalar(scale);
    direction.subVectors(to,from);transform.position.copy(from).add(to).multiplyScalar(.5);
    transform.quaternion.setFromUnitVectors(yAxis,direction.clone().normalize());
    transform.scale.set(.022,direction.length(),.022);transform.updateMatrix();bonds.setMatrixAt(i,transform.matrix);
  });
  bonds.instanceMatrix.needsUpdate=true;molecule.add(bonds);
  scene.add(new THREE.HemisphereLight('#ffffff','#654293',1.25));
  const key=new THREE.DirectionalLight('#fff9ff',3.4);key.position.set(-4,7,8);key.castShadow=!compact;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:30});
  key.shadow.bias=-.0001;key.shadow.normalBias=.025;scene.add(key);
  const fill=new THREE.DirectionalLight('#d7ecff',1.15);fill.position.set(5,0,5);scene.add(fill);
  const rim=new THREE.DirectionalLight('#e1b3ff',2.1);rim.position.set(2,4,-5);scene.add(rim);
}
function buildFallback() {
  renderer?.dispose();renderer=null;host.replaceChildren();
  const canvas=document.createElement('canvas');host.appendChild(canvas);fallback=canvas.getContext('2d');
}
function drawFallback() {
  const ctx=fallback,w=ctx.canvas.width,h=ctx.canvas.height,s=Math.min(w/68,h/94),tilt=-.34,c=Math.cos(yaw),n=Math.sin(yaw);
  ctx.clearRect(0,0,w,h);
  const points=model.atoms.map(([x,y,z,r,backbone,chain])=>{
    const rx=x*c+z*n,rz=-x*n+z*c,ry=y*Math.cos(pitch)-rz*Math.sin(pitch),depth=y*Math.sin(pitch)+rz*Math.cos(pitch);
    return{x:w/2+(rx*Math.cos(tilt)-ry*Math.sin(tilt))*s,y:h/2-(rx*Math.sin(tilt)+ry*Math.cos(tilt))*s,z:depth,r:r*s*(backbone ? .74 : .61),backbone,chain};
  });
  ctx.lineWidth=s*.32;ctx.strokeStyle='#b197ce';
  for(const[a,b]of model.bonds){ctx.beginPath();ctx.moveTo(points[a].x,points[a].y);ctx.lineTo(points[b].x,points[b].y);ctx.stroke();}
  for(const p of points.sort((a,b)=>a.z-b.z)){
    const g=ctx.createRadialGradient(p.x-p.r*.3,p.y-p.r*.4,p.r*.05,p.x,p.y,p.r);
    g.addColorStop(0,'#e5ccfa');g.addColorStop(.35,p.backbone?(p.chain?'#ac65d8':'#8b49cd'):'#ba93db');g.addColorStop(1,'#4d247e');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
  }
}
function resize() {
  const{width,height}=stage.getBoundingClientRect();if(!width||!height)return;
  if(renderer){camera.aspect=width/height;camera.position.z=camera.aspect<.75?16.5:15.6;camera.updateProjectionMatrix();renderer.setSize(width,height,false);}
  else if(fallback){fallback.canvas.width=Math.round(width*1.5);fallback.canvas.height=Math.round(height*1.5);}
}
function animate(time) {
  frame=requestAnimationFrame(animate);const dt=Math.min((time-lastTime)/1000||0,.04);lastTime=time;
  if(!visible||document.hidden)return;
  if(!dragging){if(autoRotate)targetYaw+=dt*.085;targetYaw+=velocity*dt*60;velocity*=Math.exp(-dt*7);}
  const ease=1-Math.exp(-dt*10);yaw+=(targetYaw-yaw)*ease;pitch+=(targetPitch-pitch)*ease;
  if(renderer){molecule.rotation.y=yaw;pose.rotation.x=pitch;renderer.render(scene,camera);}else if(fallback)drawFallback();
}
async function initialise() {
  try{
    const response=await fetch(new URL('./assets/dna-model.json',import.meta.url));if(!response.ok)throw new Error('Model unavailable');model=await response.json();
    try{buildScene();}catch{buildFallback();}
    resize();new ResizeObserver(resize).observe(stage);
    stage.classList.remove('helix-fallback');document.documentElement.classList.add('has-webgl');stage.dataset.model='molecular-dna-24bp';
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'80px'}).observe(stage);
    requestAnimationFrame(animate);
  }catch(error){stage.classList.add('helix-fallback');console.error('DNA illustration:',error);}
}
stage.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0||event.target.closest('button'))return;dragging=true;velocity=0;lastX=event.clientX;lastY=event.clientY;
  stage.setPointerCapture(event.pointerId);stage.classList.add('dragging');
});
stage.addEventListener('pointermove',event=>{
  if(!dragging)return;const dx=event.clientX-lastX,dy=event.clientY-lastY;targetYaw+=dx*.009;velocity=autoRotate?dx*.0015:0;
  targetPitch=THREE.MathUtils.clamp(targetPitch+dy*.004,-.5,.5);lastX=event.clientX;lastY=event.clientY;
});
function release(){dragging=false;stage.classList.remove('dragging');}
stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);
stage.addEventListener('keydown',event=>{
  if(event.target.closest('button'))return;
  if(event.key==='ArrowLeft')targetYaw-=.18;else if(event.key==='ArrowRight')targetYaw+=.18;
  else if(event.key==='ArrowUp')targetPitch=Math.max(-.5,targetPitch-.1);else if(event.key==='ArrowDown')targetPitch=Math.min(.5,targetPitch+.1);else return;event.preventDefault();
});
motion.addEventListener('click',()=>{autoRotate=!autoRotate;velocity=0;motionLabel();});
document.querySelector('#helix-reset')?.addEventListener('click',()=>{targetYaw=.56;targetPitch=-.13;velocity=0;});
reducedMotion.addEventListener('change',event=>{autoRotate=!event.matches;velocity=0;motionLabel();});
addEventListener('pagehide',event=>{cancelAnimationFrame(frame);if(!event.persisted)renderer?.dispose();});
addEventListener('pageshow',event=>{if(event.persisted){lastTime=0;requestAnimationFrame(animate);}});
motionLabel();initialise();

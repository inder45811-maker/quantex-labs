import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
// A projected diagram from the same paired DNA model as the interactive renderer.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const W=630,H=600,COUNT=24,PITCH=3.4,RISE=PITCH/10.5,LENGTH=COUNT*RISE;
const point=(y,phase=0)=>{const t=y/PITCH*Math.PI*2+phase;return{x:Math.cos(t),y,z:-Math.sin(t)};};
function project(p){const cy=Math.cos(.26),sy=Math.sin(.26),x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy;const cz=Math.cos(-.36),sz=Math.sin(-.36),x2=x*cz-p.y*sz,y2=x*sz+p.y*cz;const c=Math.cos(.04),s=Math.sin(.04),x3=x2*c+z*s,z3=-x2*s+z*c;const cp=Math.cos(-.08),sp=Math.sin(-.08),y3=y2*cp-z3*sp,z4=y2*sp+z3*cp,f=H/(2*Math.tan(Math.PI/12)),scale=f/(17.4-z4);return{x:W/2+x3*scale,y:H/2-(y3+.35)*scale,z:z4,s:scale};}
const segments=[];const add=(a,b,r,color)=>segments.push({a:project(a),b:project(b),r,color});
for(let chain=0;chain<2;chain++)for(let i=0;i<420;i++)add(point((i/420-.5)*LENGTH,chain*Math.PI),point(((i+1)/420-.5)*LENGTH,chain*Math.PI),.102,chain?'#b9e6f2':'#5be5ce');
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
for(let i=0;i<COUNT;i++){const y=(i-(COUNT-1)/2)*RISE,a=point(y),b=point(y,Math.PI),colors=i%4<2?['#8bc4ed','#7edbce']:['#b8d7ea','#78c8b9'];for(let j=0;j<16;j++)add(lerp(a,b,j/16),lerp(a,b,(j+1)/16),.057,colors[(j<8?0:1)^(i%2)]);}
segments.sort((a,b)=>(a.a.z+a.b.z)-(b.a.z+b.b.z));const n=v=>v.toFixed(2);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><g stroke-linecap="round">${segments.map(l=>`<path d="M${n(l.a.x)} ${n(l.a.y)}L${n(l.b.x)} ${n(l.b.y)}" stroke="${l.color}" stroke-width="${n(l.r*(l.a.s+l.b.s))}"/><path d="M${n(l.a.x-1)} ${n(l.a.y-1)}L${n(l.b.x-1)} ${n(l.b.y-1)}" stroke="#fff" stroke-opacity=".23" stroke-width="${n(Math.max(1,l.r*(l.a.s+l.b.s)*.24))}"/>`).join('')}</g></svg>`;
fs.mkdirSync(path.join(root,'dist/assets'),{recursive:true});fs.writeFileSync(path.join(root,'dist/assets/dna-fallback.svg'),svg);

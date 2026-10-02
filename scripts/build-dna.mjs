// Idealized B-DNA illustration derived from experimental nucleotide coordinates.
// Source: Drew et al., RCSB PDB 1BNA, https://www.rcsb.org/structure/1BNA
// Run: node site/scripts/build-dna.mjs path/to/1BNA.pdb > dna-model.json
import fs from 'node:fs';
const source = fs.readFileSync(process.argv[2], 'utf8');
const sourceAtoms = source.split(/\r?\n/).filter(line => line.startsWith('ATOM  ')).map(line => ({
  name: line.slice(12, 16).trim(), chain: line[21], residue: Number(line.slice(22, 26)),
  p: [Number(line.slice(30, 38)), Number(line.slice(38, 46)), Number(line.slice(46, 54))],
  element: line.slice(76, 78).trim()
}));
const add = (a,b) => a.map((v,i) => v+b[i]);
const sub = (a,b) => a.map((v,i) => v-b[i]);
const mul = (a,s) => a.map(v => v*s);
const dot = (a,b) => a.reduce((s,v,i) => s+v*b[i],0);
const unit = a => mul(a,1/Math.sqrt(dot(a,a)));
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const backbone = a => a.name.includes("'") || /^(P|OP[12]|O[12]P)$/.test(a.name);
const pair = n => sourceAtoms.filter(a => a.chain==='A' && a.residue===n || a.chain==='B' && a.residue===25-n);
const center = n => {const a=pair(n).filter(a=>!backbone(a));return mul(a.reduce((p,a)=>add(p,a.p),[0,0,0]),1/a.length)};
const templates = [7].map(n => {
  const origin=center(n), y=unit(sub(center(n+1),center(n-1)));
  const atoms=pair(n), a=atoms.find(a=>a.chain==='A'&&a.name==="C1'"), b=atoms.find(a=>a.chain==='B'&&a.name==="C1'");
  const across=sub(b.p,a.p), x=unit(sub(across,mul(y,dot(across,y)))), z=unit(cross(x,y));
  return atoms.map(a=>({...a,p:[dot(sub(a.p,origin),x),dot(sub(a.p,origin),y),dot(sub(a.p,origin),z)]}));
});
const atoms=[], count=24, radius={C:1.7,N:1.55,O:1.52,P:1.8};
for(let step=0;step<count;step++){
  const template=templates[step%templates.length], angle=step*Math.PI*2/10.5;
  for(const a of template){const [x,y,z]=a.p;atoms.push({p:[x*Math.cos(angle)+z*Math.sin(angle),y+(step-(count-1)/2)*3.38,-x*Math.sin(angle)+z*Math.cos(angle)],name:a.name,element:a.element,chain:a.chain,step,backbone:backbone(a),radius:radius[a.element]||1.6});}
}
const bonds=[];
const covalent={C:.76,N:.71,O:.66,P:1.07};
for(let i=0;i<atoms.length;i++)for(let j=i+1;j<atoms.length;j++){
  const a=atoms[i],b=atoms[j];if(a.chain!==b.chain||a.step!==b.step)continue;
  const d=sub(a.p,b.p),d2=dot(d,d),limit=(covalent[a.element]||.7)+(covalent[b.element]||.7)+.38;
  if(d2<limit*limit&&d2>.64)bonds.push([i,j]);
}
// Connect the two antiparallel sugar/phosphate backbones.
for(const chain of ['A','B'])for(let step=0;step<count-1;step++){
 const names=chain==='A'?["O3'",'P']:['P',"O3'"];
 const i=atoms.findIndex(a=>a.chain===chain&&a.step===step&&a.name===names[0]);
 const j=atoms.findIndex(a=>a.chain===chain&&a.step===step+1&&a.name===names[1]);
 if(i>=0&&j>=0)bonds.push([i,j]);
}
console.log(JSON.stringify({source:'https://www.rcsb.org/structure/1BNA',description:'Idealized 24-base-pair B-DNA derived from 1BNA nucleotide coordinates; artistic colour scheme.',atoms:atoms.map(a=>[...a.p.map(v=>Math.round(v*1000)/1000),a.radius,a.backbone?1:0,a.chain==='A'?0:1,a.element]),bonds}));

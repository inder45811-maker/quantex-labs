import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'pages-dist');
const site=JSON.parse(fs.readFileSync(path.join(root,'content/site.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/catalog.json'),'utf8'));
const origin=new URL(process.env.QUANTEX_ORIGIN||'https://inder45811-maker.github.io').origin;
const base=(process.env.QUANTEX_BASE_PATH??'/quantex-labs').replace(/\/+$/,'');
const prefix=base+'/';
const routes=['/','/products/','/quality/','/about/','/contact/','/faq/',...catalog.map(p=>'/products/'+p.slug+'/')];
const filename=route=>route==='/'?'index.html':route.slice(1)+'index.html';
let references=0,schemas=0;
function checkLocal(href) {
  if(href.startsWith('#'))return;
  const url=new URL(href.replaceAll('&amp;','&'),origin+prefix);
  if(url.origin!==origin)return;
  assert(url.pathname.startsWith(prefix),'URL escapes deployment base: '+href);
  const relative=url.pathname.slice(prefix.length);
  const file=path.join(output,relative.endsWith('/')?relative+'index.html':relative||'index.html');
  assert(fs.existsSync(file),'Missing route or asset: '+href);
  references++;
}
for(const route of [...routes,'/404.html']) {
  const file=path.join(output,route==='/404.html'?'404.html':filename(route));
  const html=fs.readFileSync(file,'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  if(site.mode==='preview')assert(html.includes('content="noindex,follow"'));
  assert(!html.includes('${version}'));
  const canonical=html.match(/rel="canonical" href="([^"]+)"/)[1];
  assert(canonical.startsWith(origin+prefix),'Incorrect canonical: '+canonical);
  if(new URL(site.origin).origin!==origin)assert(!html.includes(site.origin),'Old deployment origin in '+file);
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  schemas+=graph.length;
  for(const entry of graph)if(entry.url)assert(entry.url.startsWith(origin+prefix));
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if(match[1]===canonical)continue;
    checkLocal(match[1]);
  }
}
const config=fs.readFileSync(path.join(output,'site-config.js'),'utf8');
assert(config.includes('"basePath":'+JSON.stringify(base)));
assert(config.includes('"directoryRoutes":true'));
assert(!fs.existsSync(path.join(output,'products.html')),'Flat route leaked into Pages artifact.');
const css=fs.readFileSync(path.join(output,'styles.css'),'utf8');
assert(!/url\(['"]?\/assets\//.test(css),'Font escapes deployment base.');
assert(css.includes("url('./assets/fonts/space-grotesk-latin.woff2')"));
for(const asset of ['assets/fonts/space-grotesk-latin.woff2','dna-helix.js','vendor/three.module.min.js','vendor/three.core.min.js'])assert(fs.existsSync(path.join(output,asset)));
if(site.mode==='preview')assert(!fs.readFileSync(path.join(output,'sitemap.xml'),'utf8').includes('<loc>'));
const report={checkedPages:routes.length+1,localReferences:references,parsedStructuredDataNodes:schemas,origin,basePath:base,directoryRoutes:true,sampleDisclosuresPreserved:catalog.every(p=>p.confirmed||fs.readFileSync(path.join(output,filename('/products/'+p.slug+'/')),'utf8').includes('Sample listing')),success:true};
fs.writeFileSync(path.join(root,'reports/pages-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));

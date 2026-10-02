import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(root,'pages-dist');
// This generated directory is the only cleanup target; preserve source assets.
if(path.dirname(output)!==root||path.basename(output)!=='pages-dist')throw Error('Invalid Pages output path.');
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
for(const name of ['assets','vendor','styles.css','app.js','motion.js','dna-loader.js','dna-helix.js']) {
  fs.cpSync(path.join(root,'dist',name),path.join(output,name),{recursive:true});
}
const stylesheet=path.join(output,'styles.css');
fs.writeFileSync(stylesheet,fs.readFileSync(stylesheet,'utf8').replace("url('/assets/","url('./assets/"));
const env={...process.env,
  QUANTEX_OUTPUT_DIR:'pages-dist',
  QUANTEX_DIRECTORY_ROUTES:'true',
  QUANTEX_ORIGIN:process.env.QUANTEX_ORIGIN??'https://inder45811-maker.github.io',
  QUANTEX_BASE_PATH:process.env.QUANTEX_BASE_PATH??'/quantex-labs'};
for(const script of ['build-site.mjs','verify-pages.mjs']) {
  const result=spawnSync(process.execPath,[path.join(root,'scripts',script)],{env,stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
fs.writeFileSync(path.join(output,'.nojekyll'),'');

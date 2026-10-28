import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const assets=(await readdir('dist/assets')).filter(f=>/\.(js|css|woff2?|png|svg)$/.test(f));
const hash=createHash('sha256').update(assets.join('|')).digest('hex').slice(0,12);
let worker=await readFile('dist/sw.js','utf8');
worker=worker.replace('holy-ministries-shell-v1','holy-ministries-shell-'+hash).replace("const SHELL=[",'const SHELL=['+assets.map(f=>JSON.stringify('/assets/'+f)).join(',')+',');
await writeFile('dist/sw.js',worker);
console.log(`PWA shell ${hash}: ${assets.length} build assets included for offline shell support.`);

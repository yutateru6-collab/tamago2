import { mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { RELEASE } from '../engine.js';
// Explicit allowlist: never deploy tests, node_modules, git metadata, or docs.
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for (const name of ['index.html','styles.css','app.js','engine.js','sprites.js','journey.js','fullscreen.css','icon.svg','manifest.webmanifest']) await copyFile(name,`dist/${name}`);
await writeFile('dist/version.json',JSON.stringify({app:'tamago2',release:RELEASE})+'\n');
console.log('Built tamago2:',RELEASE,'(10 public files)');
